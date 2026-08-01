-- Populate DORA Metrics Tables with 2 Years of Data (2024-2025)
-- Project ID: 1
-- Pattern: Shows improvement trends over time with some realistic variations
-- 2024: Worse performance (learning phase)
-- 2025: Better performance (mature phase)

-- ============================================================================
-- 1. DEPLOYMENT FREQUENCY
-- ============================================================================
-- Pattern: Increasing frequency over time (weekly to daily deployments)
-- 2024: ~1-2 deployments per week
-- 2025: ~3-5 deployments per week

DO $$
DECLARE
  base_date DATE := '2024-01-01';
  curr_date DATE;
  week_num INTEGER;
  deployments_per_week INTEGER;
  deploy_count INTEGER;
  hour_offset INTEGER;
BEGIN
  -- Generate deployments for 2024 (104 weeks)
  FOR week_num IN 0..103 LOOP
    curr_date := base_date + (week_num * 7);
    
    -- 2024: Start with 1-2 deployments/week, gradually increase
    IF week_num < 26 THEN
      deployments_per_week := 1;
    ELSIF week_num < 52 THEN
      deployments_per_week := CASE WHEN week_num % 2 = 0 THEN 2 ELSE 1 END;
    ELSE
      deployments_per_week := 2;
    END IF;
    
    -- Insert deployments for this week
    FOR deploy_count IN 1..deployments_per_week LOOP
      hour_offset := (deploy_count - 1) * (24 * 7 / deployments_per_week);
      
      INSERT INTO deployment_frequency (
        project_id,
        deployment_id,
        version,
        environment,
        deployment_timestamp
      ) VALUES (
        1,
        'deploy-2024-w' || week_num || '-' || deploy_count,
        '1.' || (week_num / 4) || '.' || deploy_count,
        'production',
        curr_date + (hour_offset || ' hours')::INTERVAL + 
        (CASE WHEN deploy_count % 2 = 0 THEN '14 hours' ELSE '10 hours' END)::INTERVAL
      );
    END LOOP;
  END LOOP;
  
  -- Generate deployments for 2025 (52 weeks)
  base_date := '2025-01-01';
  FOR week_num IN 0..51 LOOP
    curr_date := base_date + (week_num * 7);
    
    -- 2025: 2-5 deployments/week, showing maturity
    IF week_num < 13 THEN
      deployments_per_week := 2;
    ELSIF week_num < 26 THEN
      deployments_per_week := 3;
    ELSIF week_num < 39 THEN
      deployments_per_week := 4;
    ELSE
      deployments_per_week := 5;
    END IF;
    
    -- Insert deployments for this week
    FOR deploy_count IN 1..deployments_per_week LOOP
      hour_offset := (deploy_count - 1) * (24 * 7 / deployments_per_week);
      
      INSERT INTO deployment_frequency (
        project_id,
        deployment_id,
        version,
        environment,
        deployment_timestamp
      ) VALUES (
        1,
        'deploy-2025-w' || week_num || '-' || deploy_count,
        '2.' || (week_num / 4) || '.' || deploy_count,
        'production',
        curr_date + (hour_offset || ' hours')::INTERVAL + 
        (CASE WHEN deploy_count % 2 = 0 THEN '15 hours' ELSE '11 hours' END)::INTERVAL
      );
    END LOOP;
  END LOOP;
  
  RAISE NOTICE 'Inserted deployment_frequency records';
END $$;

-- ============================================================================
-- 2. LEAD TIME FOR CHANGES
-- ============================================================================
-- Pattern: Decreasing lead time over time (slower to faster delivery)
-- 2024: 120-200 hours average (5-8 days)
-- 2025: 24-72 hours average (1-3 days)

DO $$
DECLARE
  base_date DATE := '2024-01-01';
  curr_date DATE;
  week_num INTEGER;
  changes_per_week INTEGER;
  change_count INTEGER;
  lead_time_hours DECIMAL;
  merged_ts TIMESTAMP;
  deployed_ts TIMESTAMP;
BEGIN
  -- Generate changes for 2024 (104 weeks)
  FOR week_num IN 0..103 LOOP
    curr_date := base_date + (week_num * 7);
    
    -- 2024: 2-4 changes per week
    changes_per_week := 2 + (week_num / 26); -- Gradually increase
    
    FOR change_count IN 1..changes_per_week LOOP
      -- 2024: High lead time, gradually improving
      IF week_num < 26 THEN
        lead_time_hours := 180 + (random() * 50); -- 180-230 hours
      ELSIF week_num < 52 THEN
        lead_time_hours := 140 + (random() * 40); -- 140-180 hours
      ELSIF week_num < 78 THEN
        lead_time_hours := 100 + (random() * 40); -- 100-140 hours
      ELSE
        lead_time_hours := 72 + (random() * 48);  -- 72-120 hours
      END IF;
      
      merged_ts := curr_date + (change_count * 36 || ' hours')::INTERVAL;
      deployed_ts := merged_ts + (lead_time_hours || ' hours')::INTERVAL;
      
      INSERT INTO lead_time_changes (
        project_id,
        change_id,
        merged_timestamp,
        deployed_timestamp,
        lead_time_hours
      ) VALUES (
        1,
        'mr-2024-w' || week_num || '-' || change_count,
        merged_ts,
        deployed_ts,
        ROUND(lead_time_hours, 2)
      );
    END LOOP;
  END LOOP;
  
  -- Generate changes for 2025 (52 weeks)
  base_date := '2025-01-01';
  FOR week_num IN 0..51 LOOP
    curr_date := base_date + (week_num * 7);
    
    -- 2025: 4-6 changes per week (more frequent, smaller changes)
    changes_per_week := 4 + (week_num / 13);
    
    FOR change_count IN 1..changes_per_week LOOP
      -- 2025: Much lower lead time
      IF week_num < 13 THEN
        lead_time_hours := 60 + (random() * 36); -- 60-96 hours
      ELSIF week_num < 26 THEN
        lead_time_hours := 48 + (random() * 24); -- 48-72 hours
      ELSIF week_num < 39 THEN
        lead_time_hours := 32 + (random() * 24); -- 32-56 hours
      ELSE
        lead_time_hours := 24 + (random() * 24); -- 24-48 hours
      END IF;
      
      merged_ts := curr_date + (change_count * 24 || ' hours')::INTERVAL;
      deployed_ts := merged_ts + (lead_time_hours || ' hours')::INTERVAL;
      
      INSERT INTO lead_time_changes (
        project_id,
        change_id,
        merged_timestamp,
        deployed_timestamp,
        lead_time_hours
      ) VALUES (
        1,
        'mr-2025-w' || week_num || '-' || change_count,
        merged_ts,
        deployed_ts,
        ROUND(lead_time_hours, 2)
      );
    END LOOP;
  END LOOP;
  
  RAISE NOTICE 'Inserted lead_time_changes records';
END $$;

-- ============================================================================
-- 3. CHANGE FAILURE RATE
-- ============================================================================
-- Pattern: Decreasing failure rate over time
-- 2024: 25-35% failure rate
-- 2025: 8-15% failure rate

DO $$
DECLARE
  base_date DATE := '2024-01-01';
  curr_date DATE;
  week_num INTEGER;
  deployments_per_week INTEGER;
  deploy_count INTEGER;
  is_failure BOOLEAN;
  failure_threshold DECIMAL;
  remediation VARCHAR(50);
BEGIN
  -- Generate failures for 2024 (104 weeks)
  FOR week_num IN 0..103 LOOP
    curr_date := base_date + (week_num * 7);
    
    -- Match deployment frequency from table 1
    IF week_num < 26 THEN
      deployments_per_week := 1;
    ELSIF week_num < 52 THEN
      deployments_per_week := CASE WHEN week_num % 2 = 0 THEN 2 ELSE 1 END;
    ELSE
      deployments_per_week := 2;
    END IF;
    
    FOR deploy_count IN 1..deployments_per_week LOOP
      -- 2024: Higher failure rate, gradually improving
      IF week_num < 26 THEN
        failure_threshold := 0.35; -- 35% failure rate
      ELSIF week_num < 52 THEN
        failure_threshold := 0.30; -- 30% failure rate
      ELSIF week_num < 78 THEN
        failure_threshold := 0.22; -- 22% failure rate
      ELSE
        failure_threshold := 0.18; -- 18% failure rate
      END IF;
      
      is_failure := random() < failure_threshold;
      
      -- Determine remediation type if failure occurred
      IF is_failure THEN
        IF random() < 0.4 THEN
          remediation := 'rollback';
        ELSIF random() < 0.7 THEN
          remediation := 'hotfix';
        ELSE
          remediation := 'emergency';
        END IF;
      ELSE
        -- Some incidents that don't count as failures
        IF random() < 0.1 THEN
          remediation := 'patch'; -- Minor fix, not counted as failure
        ELSE
          remediation := 'none';
        END IF;
      END IF;
      
      INSERT INTO change_failure_rate (
        project_id,
        deployment_id,
        deployment_timestamp,
        has_incident,
        remediation_type
      ) VALUES (
        1,
        'deploy-2024-w' || week_num || '-' || deploy_count,
        curr_date + ((deploy_count - 1) * 72 || ' hours')::INTERVAL + '14 hours'::INTERVAL,
        is_failure OR remediation = 'patch',
        remediation
      );
    END LOOP;
  END LOOP;
  
  -- Generate failures for 2025 (52 weeks)
  base_date := '2025-01-01';
  FOR week_num IN 0..51 LOOP
    curr_date := base_date + (week_num * 7);
    
    -- Match deployment frequency from table 1
    IF week_num < 13 THEN
      deployments_per_week := 2;
    ELSIF week_num < 26 THEN
      deployments_per_week := 3;
    ELSIF week_num < 39 THEN
      deployments_per_week := 4;
    ELSE
      deployments_per_week := 5;
    END IF;
    
    FOR deploy_count IN 1..deployments_per_week LOOP
      -- 2025: Much lower failure rate
      IF week_num < 13 THEN
        failure_threshold := 0.15; -- 15% failure rate
      ELSIF week_num < 26 THEN
        failure_threshold := 0.12; -- 12% failure rate
      ELSIF week_num < 39 THEN
        failure_threshold := 0.10; -- 10% failure rate
      ELSE
        failure_threshold := 0.08; -- 8% failure rate
      END IF;
      
      is_failure := random() < failure_threshold;
      
      IF is_failure THEN
        IF random() < 0.3 THEN
          remediation := 'rollback';
        ELSIF random() < 0.6 THEN
          remediation := 'hotfix';
        ELSE
          remediation := 'emergency';
        END IF;
      ELSE
        IF random() < 0.08 THEN
          remediation := 'patch';
        ELSE
          remediation := 'none';
        END IF;
      END IF;
      
      INSERT INTO change_failure_rate (
        project_id,
        deployment_id,
        deployment_timestamp,
        has_incident,
        remediation_type
      ) VALUES (
        1,
        'deploy-2025-w' || week_num || '-' || deploy_count,
        curr_date + ((deploy_count - 1) * 36 || ' hours')::INTERVAL + '15 hours'::INTERVAL,
        is_failure OR remediation = 'patch',
        remediation
      );
    END LOOP;
  END LOOP;
  
  RAISE NOTICE 'Inserted change_failure_rate records';
END $$;

-- ============================================================================
-- 4. TIME TO RESTORE SERVICE
-- ============================================================================
-- Pattern: Decreasing restore time over time
-- 2024: 8-24 hours average
-- 2025: 1-6 hours average

DO $$
DECLARE
  base_date DATE := '2024-01-01';
  curr_date DATE;
  week_num INTEGER;
  incident_count INTEGER;
  total_incidents INTEGER := 0;
  restore_hours DECIMAL;
  start_ts TIMESTAMP;
  end_ts TIMESTAMP;
  incident_descriptions TEXT[] := ARRAY[
    'Database connection pool exhausted',
    'Memory leak in API service',
    'Third-party service timeout',
    'Configuration error after deployment',
    'SSL certificate expiration',
    'Load balancer misconfiguration',
    'Cache invalidation issue',
    'Rate limiting bug',
    'Authentication service outage',
    'Database query performance degradation'
  ];
BEGIN
  -- Generate incidents for 2024 (104 weeks)
  FOR week_num IN 0..103 LOOP
    curr_date := base_date + (week_num * 7);
    
    -- 2024: More incidents, varies by quarter
    IF week_num < 26 THEN
      -- Q1: 0-1 incidents per week (high failure rate period)
      incident_count := CASE WHEN random() < 0.5 THEN 1 ELSE 0 END;
    ELSIF week_num < 52 THEN
      -- Q2: 0-1 incidents per week
      incident_count := CASE WHEN random() < 0.4 THEN 1 ELSE 0 END;
    ELSIF week_num < 78 THEN
      -- Q3: 0-1 incidents every 2 weeks
      incident_count := CASE WHEN random() < 0.3 THEN 1 ELSE 0 END;
    ELSE
      -- Q4: 0-1 incidents every 2 weeks
      incident_count := CASE WHEN random() < 0.25 THEN 1 ELSE 0 END;
    END IF;
    
    IF incident_count > 0 THEN
      total_incidents := total_incidents + 1;
      
      -- 2024: Longer restore times, gradually improving
      IF week_num < 26 THEN
        restore_hours := 12 + (random() * 12); -- 12-24 hours
      ELSIF week_num < 52 THEN
        restore_hours := 8 + (random() * 10);  -- 8-18 hours
      ELSIF week_num < 78 THEN
        restore_hours := 6 + (random() * 8);   -- 6-14 hours
      ELSE
        restore_hours := 4 + (random() * 6);   -- 4-10 hours
      END IF;
      
      start_ts := curr_date + ((random() * 6)::INTEGER || ' days')::INTERVAL + 
                  ((random() * 24)::INTEGER || ' hours')::INTERVAL;
      end_ts := start_ts + (restore_hours || ' hours')::INTERVAL;
      
      INSERT INTO time_to_restore_service (
        project_id,
        incident_id,
        start_time,
        end_time,
        restore_time_hours,
        description
      ) VALUES (
        1,
        'incident-2024-' || total_incidents,
        start_ts,
        end_ts,
        ROUND(restore_hours, 2),
        incident_descriptions[(random() * 9 + 1)::INTEGER]
      );
    END IF;
  END LOOP;
  
  -- Generate incidents for 2025 (52 weeks)
  base_date := '2025-01-01';
  FOR week_num IN 0..51 LOOP
    curr_date := base_date + (week_num * 7);
    
    -- 2025: Fewer incidents overall
    IF week_num < 13 THEN
      -- Q1: 0-1 incidents every 2 weeks
      incident_count := CASE WHEN random() < 0.2 THEN 1 ELSE 0 END;
    ELSIF week_num < 26 THEN
      -- Q2: 0-1 incidents every 3 weeks
      incident_count := CASE WHEN random() < 0.15 THEN 1 ELSE 0 END;
    ELSIF week_num < 39 THEN
      -- Q3: 0-1 incidents every 3 weeks
      incident_count := CASE WHEN random() < 0.12 THEN 1 ELSE 0 END;
    ELSE
      -- Q4: 0-1 incidents every 4 weeks
      incident_count := CASE WHEN random() < 0.10 THEN 1 ELSE 0 END;
    END IF;
    
    IF incident_count > 0 THEN
      total_incidents := total_incidents + 1;
      
      -- 2025: Much faster restore times
      IF week_num < 13 THEN
        restore_hours := 3 + (random() * 5);   -- 3-8 hours
      ELSIF week_num < 26 THEN
        restore_hours := 2 + (random() * 4);   -- 2-6 hours
      ELSIF week_num < 39 THEN
        restore_hours := 1.5 + (random() * 3); -- 1.5-4.5 hours
      ELSE
        restore_hours := 1 + (random() * 2);   -- 1-3 hours
      END IF;
      
      start_ts := curr_date + ((random() * 6)::INTEGER || ' days')::INTERVAL + 
                  ((random() * 24)::INTEGER || ' hours')::INTERVAL;
      end_ts := start_ts + (restore_hours || ' hours')::INTERVAL;
      
      INSERT INTO time_to_restore_service (
        project_id,
        incident_id,
        start_time,
        end_time,
        restore_time_hours,
        description
      ) VALUES (
        1,
        'incident-2025-' || total_incidents,
        start_ts,
        end_ts,
        ROUND(restore_hours, 2),
        incident_descriptions[(random() * 9 + 1)::INTEGER]
      );
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Inserted time_to_restore_service records';
END $$;

-- ============================================================================
-- SUMMARY STATISTICS
-- ============================================================================

-- Deployment Frequency Summary
SELECT 
  EXTRACT(YEAR FROM deployment_timestamp) AS year,
  COUNT(*) AS total_deployments,
  ROUND(COUNT(*) / 52.0, 2) AS avg_per_week
FROM deployment_frequency
WHERE project_id = 1
GROUP BY EXTRACT(YEAR FROM deployment_timestamp)
ORDER BY year;

-- Lead Time Summary
SELECT 
  EXTRACT(YEAR FROM merged_timestamp) AS year,
  COUNT(*) AS total_changes,
  ROUND(AVG(lead_time_hours), 2) AS avg_lead_time_hours,
  ROUND(AVG(lead_time_hours) / 24, 2) AS avg_lead_time_days
FROM lead_time_changes
WHERE project_id = 1
GROUP BY EXTRACT(YEAR FROM merged_timestamp)
ORDER BY year;

-- Change Failure Rate Summary
SELECT 
  EXTRACT(YEAR FROM deployment_timestamp) AS year,
  COUNT(*) AS total_deployments,
  SUM(CASE WHEN is_failure THEN 1 ELSE 0 END) AS failures,
  ROUND(100.0 * SUM(CASE WHEN is_failure THEN 1 ELSE 0 END) / COUNT(*), 2) AS failure_rate_pct
FROM change_failure_rate
WHERE project_id = 1
GROUP BY EXTRACT(YEAR FROM deployment_timestamp)
ORDER BY year;

-- Time to Restore Service Summary
SELECT 
  EXTRACT(YEAR FROM start_time) AS year,
  COUNT(*) AS total_incidents,
  ROUND(AVG(restore_time_hours), 2) AS avg_restore_hours
FROM time_to_restore_service
WHERE project_id = 1
GROUP BY EXTRACT(YEAR FROM start_time)
ORDER BY year;

-- Monthly Breakdown for Trend Analysis
SELECT 
  TO_CHAR(deployment_timestamp, 'YYYY-MM') AS month,
  COUNT(*) AS deployments
FROM deployment_frequency
WHERE project_id = 1
GROUP BY TO_CHAR(deployment_timestamp, 'YYYY-MM')
ORDER BY month;
