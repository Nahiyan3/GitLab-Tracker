import { getPool } from '../../db/connection';
import axios from 'axios';

export async function autoMapSonarProjectKeys() {
  const pool = getPool();
  // Fetch all SonarQube projects (works for both SonarCloud and self-hosted)
  // Trim values to remove any whitespace
  const sonarUrl = (process.env.SONARQUBE_URL || '').trim().replace(/\/$/, ''); // Remove trailing slash
  const sonarToken = (process.env.SONARQUBE_TOKEN || '').trim();
  const sonarOrg = (process.env.SONARQUBE_ORGANIZATION || '').trim();
  
  console.log('🔧 SonarQube Configuration:');
  console.log(`  URL: "${sonarUrl}"`);
  console.log(`  Token: ${sonarToken ? sonarToken.substring(0, 10) + '...' : 'NOT SET'}`);
  console.log(`  Token length: ${sonarToken.length} characters`);
  console.log(`  Organization: ${sonarOrg || 'NOT SET (OK for self-hosted)'}`);
  
  if (!sonarUrl || !sonarToken) {
    console.error('❌ SONARQUBE_URL or SONARQUBE_TOKEN not configured');
    return;
  }
  
  // Organization is only required for SonarCloud, not for self-hosted SonarQube
  const isSonarCloud = sonarUrl.includes('sonarcloud.io');
  
  if (isSonarCloud && !sonarOrg) {
    console.warn('⚠️ SONARQUBE_ORGANIZATION is required for SonarCloud. Skipping auto-mapping.');
    return;
  }
  
  const projects: { key: string; name: string }[] = [];
  let page = 1;
  const pageSize = 500;
  let total = 0;
  
  try {
    do {
      // Build URL - only add organization parameter for SonarCloud
      let url = `${sonarUrl}/api/components/search?qualifiers=TRK&p=${page}&ps=${pageSize}`;
      if (sonarOrg) {
        url += `&organization=${sonarOrg}`;
      }
      
      // SonarCloud uses Bearer token auth; self-hosted SonarQube uses Basic auth
      const authHeader = isSonarCloud
        ? { Authorization: `Bearer ${sonarToken}` }
        : { Authorization: 'Basic ' + Buffer.from(sonarToken + ':').toString('base64') };
      
      const resp = await axios.get(url, {
        headers: authHeader,
      });
      const data = resp.data;
      
      // Check if we got HTML instead of JSON (authentication failure)
      if (typeof data === 'string' && data.includes('<!DOCTYPE html>')) {
        throw new Error('Authentication failed: Received HTML login page instead of JSON. Check your SONARQUBE_TOKEN.');
      }
      
      console.log('✅ Successfully fetched SonarQube data');
      
      if (data.components && Array.isArray(data.components)) {
        for (const c of data.components) {
          projects.push({ key: c.key, name: c.name });
        }
      }
      total = data.paging ? data.paging.total : projects.length;
      page++;
    } while (projects.length < total);
  } catch (error: any) {
    console.error('Failed to fetch SonarQube projects:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    throw error;
  }

  // Fetch all local projects from the registry
  const dbProjects = await pool.query('SELECT id, name FROM projects');

  console.log(`\n📋 Found ${projects.length} SonarQube projects and ${dbProjects.rows.length} database projects`);

  function normalize(str: string) {
    return str.replace(/[-_]/g, '').trim().toLowerCase();
  }
  
  console.log('\n🔍 Matching results:\n');
  
  for (const dbProject of dbProjects.rows) {
    const dbNorm = normalize(dbProject.name);
    
    // Try to find match by name or key
    let match = projects.find(
      p => normalize(p.name) === dbNorm || normalize(p.key) === dbNorm
    );
    
    // If no match, try to find if the SonarQube key ends with the DB project name
    if (!match) {
      match = projects.find(p => {
        const keyNorm = normalize(p.key);
        return keyNorm.endsWith(dbNorm) || keyNorm.includes(dbNorm);
      });
    }
    
    if (match) {
      await pool.query(
        'UPDATE projects SET sonar_project_key = $1 WHERE id = $2',
        [match.key, dbProject.id]
      );
      console.log(`✅ "${dbProject.name}" → "${match.key}"`);
    } else {
      console.log(`❌ "${dbProject.name}" → No match`);
    }
  }
}

// Helper function to get SonarCloud project key from database
export async function getSonarProjectKey(projectId: number): Promise<string | null> {
  const pool = getPool();
  const result = await pool.query(
    'SELECT sonar_project_key FROM projects WHERE id = $1',
    [projectId]
  );
  if (result.rows.length > 0 && result.rows[0].sonar_project_key) {
    return result.rows[0].sonar_project_key;
  }
  return null;
}
