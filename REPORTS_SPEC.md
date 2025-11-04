# Reports Specification

This document outlines the reporting requirements and SQL logic for the HR Management System.

## Overview

Reports provide insights into attendance, leave usage, payroll, and workforce analytics. All reports are generated server-side with efficient SQL aggregations.

## Report Categories

1. **Attendance Reports**
2. **Leave Reports**
3. **Payroll Reports**
4. **Workforce Analytics**

---

## 1. Attendance Reports

### 1.1 Hours Worked Report

**Purpose**: Total hours worked by employee over a date range.

**Inputs**:
- Employee ID (optional, all if empty)
- Start date
- End date

**SQL Query**:
```sql
SELECT 
  e.id as employee_id,
  e.code,
  e.first_name,
  e.last_name,
  COUNT(DISTINCT al.date) as days_present,
  SUM(
    CASE 
      WHEN al.clock_in IS NOT NULL AND al.clock_out IS NOT NULL 
      THEN TIMESTAMPDIFF(MINUTE, al.clock_in, al.clock_out) - COALESCE(al.breaks_minutes, 0)
      ELSE 0
    END
  ) as total_minutes_worked,
  ROUND(
    SUM(
      CASE 
        WHEN al.clock_in IS NOT NULL AND al.clock_out IS NOT NULL 
        THEN TIMESTAMPDIFF(MINUTE, al.clock_in, al.clock_out) - COALESCE(al.breaks_minutes, 0)
        ELSE 0
      END
    ) / 60.0, 2
  ) as total_hours_worked
FROM employees e
LEFT JOIN attendance_logs al ON e.id = al.employee_id
WHERE e.status = 'ACTIVE'
  AND al.date BETWEEN :start_date AND :end_date
GROUP BY e.id, e.code, e.first_name, e.last_name
ORDER BY total_hours_worked DESC;
```

**Output**:
```typescript
{
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  daysPresent: number;
  totalMinutesWorked: number;
  totalHoursWorked: number;
}
```

### 1.2 Late Arrivals Report

**Purpose**: Count and details of late clock-ins.

**Logic**: Late if `clock_in > shift.start_time + grace_minutes_in`

**SQL Query**:
```sql
SELECT 
  e.id,
  e.code,
  e.first_name,
  e.last_name,
  al.date,
  TIME(al.clock_in) as clock_in_time,
  s.start_time,
  s.grace_minutes_in,
  TIMESTAMPDIFF(MINUTE, 
    CONCAT(al.date, ' ', s.start_time),
    al.clock_in
  ) as minutes_late
FROM attendance_logs al
JOIN employees e ON al.employee_id = e.id
JOIN shifts s ON s.is_default = 1
WHERE al.clock_in IS NOT NULL
  AND al.date BETWEEN :start_date AND :end_date
  AND TIMESTAMPDIFF(MINUTE, 
    CONCAT(al.date, ' ', s.start_time),
    al.clock_in
  ) > s.grace_minutes_in
ORDER BY minutes_late DESC;
```

**Summary Aggregation**:
```sql
SELECT 
  e.id,
  e.code,
  e.first_name,
  e.last_name,
  COUNT(*) as late_count,
  AVG(TIMESTAMPDIFF(MINUTE, 
    CONCAT(al.date, ' ', s.start_time),
    al.clock_in
  )) as avg_minutes_late
FROM attendance_logs al
JOIN employees e ON al.employee_id = e.id
JOIN shifts s ON s.is_default = 1
WHERE al.clock_in IS NOT NULL
  AND al.date BETWEEN :start_date AND :end_date
  AND TIMESTAMPDIFF(MINUTE, 
    CONCAT(al.date, ' ', s.start_time),
    al.clock_in
  ) > s.grace_minutes_in
GROUP BY e.id, e.code, e.first_name, e.last_name
ORDER BY late_count DESC;
```

### 1.3 Early Leaves Report

**Purpose**: Count and details of early clock-outs.

**Logic**: Early if `clock_out < shift.end_time - grace_minutes_out`

**SQL Query**:
```sql
SELECT 
  e.id,
  e.code,
  e.first_name,
  e.last_name,
  COUNT(*) as early_count,
  AVG(TIMESTAMPDIFF(MINUTE,
    al.clock_out,
    CONCAT(al.date, ' ', s.end_time)
  )) as avg_minutes_early
FROM attendance_logs al
JOIN employees e ON al.employee_id = e.id
JOIN shifts s ON s.is_default = 1
WHERE al.clock_out IS NOT NULL
  AND al.date BETWEEN :start_date AND :end_date
  AND TIMESTAMPDIFF(MINUTE,
    al.clock_out,
    CONCAT(al.date, ' ', s.end_time)
  ) > s.grace_minutes_out
GROUP BY e.id, e.code, e.first_name, e.last_name
ORDER BY early_count DESC;
```

### 1.4 Absence Days Report

**Purpose**: Count unplanned absences.

**SQL Query**:
```sql
SELECT 
  e.id,
  e.code,
  e.first_name,
  e.last_name,
  COUNT(*) as absence_days
FROM employees e
LEFT JOIN attendance_logs al ON e.id = al.employee_id
WHERE e.status = 'ACTIVE'
  AND DATE(al.date) BETWEEN :start_date AND :end_date
  AND (al.clock_in IS NULL OR al.id IS NULL)
  -- Exclude holidays and approved leaves
  AND NOT EXISTS (
    SELECT 1 FROM holidays h 
    WHERE h.date = :date
  )
  AND NOT EXISTS (
    SELECT 1 FROM leave_requests lr
    WHERE lr.employee_id = e.id
      AND lr.status = 'APPROVED'
      AND lr.start_date <= :date
      AND lr.end_date >= :date
  )
GROUP BY e.id, e.code, e.first_name, e.last_name
ORDER BY absence_days DESC;
```

### 1.5 Attendance Rate Report

**Purpose**: Percentage of present days vs working days.

**Formula**: `(Present Days / Working Days) * 100`

**SQL Query**:
```sql
WITH working_days AS (
  SELECT 
    DATE_ADD(:start_date, INTERVAL seq.seq DAY) as work_date
  FROM (
    SELECT @seq := @seq + 1 as seq
    FROM information_schema.columns c1, information_schema.columns c2,
         (SELECT @seq := -1) s
    LIMIT 365
  ) seq
  WHERE DATE_ADD(:start_date, INTERVAL seq.seq DAY) <= :end_date
    AND DAYOFWEEK(DATE_ADD(:start_date, INTERVAL seq.seq DAY)) NOT IN (5, 6) -- Exclude Friday/Saturday
    AND NOT EXISTS (
      SELECT 1 FROM holidays h 
      WHERE h.date = DATE_ADD(:start_date, INTERVAL seq.seq DAY)
    )
),
employee_attendance AS (
  SELECT 
    e.id,
    COUNT(DISTINCT al.date) as days_present
  FROM employees e
  LEFT JOIN attendance_logs al ON e.id = al.employee_id 
    AND al.clock_in IS NOT NULL
    AND al.date BETWEEN :start_date AND :end_date
  WHERE e.status = 'ACTIVE'
  GROUP BY e.id
)
SELECT 
  e.id,
  e.code,
  e.first_name,
  e.last_name,
  COALESCE(ea.days_present, 0) as days_present,
  (SELECT COUNT(*) FROM working_days) as working_days,
  ROUND(
    (COALESCE(ea.days_present, 0) / (SELECT COUNT(*) FROM working_days)) * 100, 
    2
  ) as attendance_rate
FROM employees e
LEFT JOIN employee_attendance ea ON e.id = ea.id
WHERE e.status = 'ACTIVE'
ORDER BY attendance_rate DESC;
```

---

## 2. Leave Reports

### 2.1 Leave Balance Report

**Purpose**: Current leave balances by type for all employees.

**SQL Query**:
```sql
SELECT 
  e.id,
  e.code,
  e.first_name,
  e.last_name,
  lt.name as leave_type,
  lt.code as leave_code,
  lb.allocated_days,
  lb.carried_over_days,
  lb.taken_days,
  lb.remaining_days
FROM employees e
JOIN leave_balances lb ON e.id = lb.employee_id
JOIN leave_types lt ON lb.leave_type_id = lt.id
WHERE e.status = 'ACTIVE'
  AND lb.year = :year
ORDER BY e.code, lt.code;
```

### 2.2 Leave Usage Summary

**Purpose**: Aggregate leave usage across employees.

**SQL Query**:
```sql
SELECT 
  lt.name as leave_type,
  lt.code as leave_code,
  COUNT(DISTINCT lr.employee_id) as employees_took,
  SUM(lr.days) as total_days_taken
FROM leave_requests lr
JOIN leave_types lt ON lr.leave_type_id = lt.id
WHERE lr.status = 'APPROVED'
  AND lr.start_date BETWEEN :start_date AND :end_date
GROUP BY lt.id, lt.name, lt.code
ORDER BY total_days_taken DESC;
```

---

## 3. Payroll Reports

### 3.1 Payroll Summary

**Purpose**: Overview of payroll runs and their statuses.

**SQL Query**:
```sql
SELECT 
  pr.id,
  pr.period_start,
  pr.period_end,
  pr.status,
  COUNT(pi.id) as employees_count,
  SUM(pi.net_pay) as total_net_pay,
  SUM(pi.gross_salary) as total_gross,
  SUM(pi.total_allowance) as total_allowances,
  SUM(pi.total_deduction) as total_deductions
FROM payroll_runs pr
LEFT JOIN payroll_items pi ON pr.id = pi.payroll_run_id
GROUP BY pr.id, pr.period_start, pr.period_end, pr.status
ORDER BY pr.period_start DESC;
```

### 3.2 Employee Payroll History

**Purpose**: Historical payroll for a specific employee.

**SQL Query**:
```sql
SELECT 
  pr.period_start,
  pr.period_end,
  pr.status,
  pi.gross_salary,
  pi.total_allowance,
  pi.total_deduction,
  pi.net_pay
FROM payroll_items pi
JOIN payroll_runs pr ON pi.payroll_run_id = pr.id
WHERE pi.employee_id = :employee_id
ORDER BY pr.period_start DESC;
```

---

## 4. Workforce Analytics

### 4.1 Department Overview

**Purpose**: Employee count and distribution by department.

**SQL Query**:
```sql
SELECT 
  d.name as department,
  d.code,
  COUNT(e.id) as total_employees,
  SUM(CASE WHEN e.status = 'ACTIVE' THEN 1 ELSE 0 END) as active_employees,
  SUM(CASE WHEN e.status = 'INACTIVE' THEN 1 ELSE 0 END) as inactive_employees
FROM departments d
LEFT JOIN employees e ON d.id = e.department_id
GROUP BY d.id, d.name, d.code
ORDER BY total_employees DESC;
```

### 4.2 Employee Tenure Analysis

**Purpose**: Years of service distribution.

**SQL Query**:
```sql
SELECT 
  e.id,
  e.code,
  e.first_name,
  e.last_name,
  e.hire_date,
  TIMESTAMPDIFF(YEAR, e.hire_date, CURDATE()) as years_of_service,
  d.name as department
FROM employees e
JOIN departments d ON e.department_id = d.id
WHERE e.status = 'ACTIVE'
ORDER BY years_of_service DESC;
```

---

## 5. Export Formats

### CSV Export

Use MySQL `INTO OUTFILE` or application-level CSV generation:
```sql
SELECT * FROM report_results
INTO OUTFILE '/tmp/report.csv'
FIELDS TERMINATED BY ',' 
ENCLOSED BY '"'
LINES TERMINATED BY '\n';
```

Or generate in application:
```typescript
const csv = results.map(row => 
  Object.values(row).join(',')
).join('\n');
```

### PDF Export

Use libraries like:
- **html-pdf** (Node.js)
- **PDFKit**
- **jsPDF** (client-side)

Generate HTML table from report data, then convert to PDF.

---

## 6. Performance Considerations

### Indexes

Ensure indexes exist on:
```sql
-- Attendance
CREATE INDEX idx_attendance_employee_date ON attendance_logs(employee_id, date);
CREATE INDEX idx_attendance_date ON attendance_logs(date);

-- Leaves
CREATE INDEX idx_leave_requests_employee_dates ON leave_requests(employee_id, start_date, end_date);
CREATE INDEX idx_leave_requests_status ON leave_requests(status);

-- Payroll
CREATE INDEX idx_payroll_periods ON payroll_runs(period_start, period_end);
CREATE INDEX idx_payroll_items_employee ON payroll_items(employee_id);

-- Holidays
CREATE INDEX idx_holidays_date ON holidays(date);
```

### Caching

Cache frequently requested reports:
- Aggregated statistics: 1 hour
- Individual reports: 30 minutes
- Real-time data: No cache

### Query Optimization

1. Limit date ranges to reasonable spans
2. Use `EXPLAIN` to verify index usage
3. Consider materialized views for complex aggregates
4. Implement pagination for large result sets

---

## 7. API Endpoints

Future implementation:

```
GET /api/reports/attendance/hours-worked
GET /api/reports/attendance/late-arrivals
GET /api/reports/attendance/early-leaves
GET /api/reports/attendance/absence-days
GET /api/reports/attendance/rate

GET /api/reports/leaves/balance
GET /api/reports/leaves/usage

GET /api/reports/payroll/summary
GET /api/reports/payroll/history/:employeeId

GET /api/reports/workforce/departments
GET /api/reports/workforce/tenure

GET /api/reports/export/csv/:reportType
GET /api/reports/export/pdf/:reportType
```

---

## 8. Dashboard KPIs

Quick metrics for dashboard display:

### Key Performance Indicators

```sql
-- Active employees
SELECT COUNT(*) FROM employees WHERE status = 'ACTIVE';

-- Today's present count
SELECT COUNT(DISTINCT employee_id) 
FROM attendance_logs 
WHERE DATE(clock_in) = CURDATE();

-- Open clocks (present but not clocked out)
SELECT COUNT(*) 
FROM attendance_logs 
WHERE DATE(clock_in) = CURDATE() 
  AND clock_out IS NULL;

-- Pending leave requests
SELECT COUNT(*) 
FROM leave_requests 
WHERE status = 'PENDING';
```

---

## 9. Future Enhancements

1. **Real-time Updates**: WebSocket push for live attendance
2. **Custom Reports**: User-defined report builders
3. **Advanced Filters**: Complex multi-criteria filtering
4. **Trend Analysis**: Time-series charts and predictions
5. **Comparative Reports**: Period-over-period comparisons
6. **Automated Exports**: Scheduled email reports

---

## 10. SQL Helper Functions

Common date range helpers:

```sql
-- Get working days in range (excluding weekends and holidays)
DELIMITER $$
CREATE FUNCTION get_working_days(start_date DATE, end_date DATE)
RETURNS INT
READS SQL DATA
BEGIN
  DECLARE working_days INT DEFAULT 0;
  DECLARE current_date DATE DEFAULT start_date;
  
  WHILE current_date <= end_date DO
    IF DAYOFWEEK(current_date) NOT IN (5, 6) THEN
      IF NOT EXISTS (SELECT 1 FROM holidays WHERE date = current_date) THEN
        SET working_days = working_days + 1;
      END IF;
    END IF;
    SET current_date = DATE_ADD(current_date, INTERVAL 1 DAY);
  END WHILE;
  
  RETURN working_days;
END$$
DELIMITER ;
```

---

## References

- [API Reference](./API_REFERENCE.md)
- [System Architecture](./SYSTEM_ARCHITECTURE.md)
- [README](./README.md)

