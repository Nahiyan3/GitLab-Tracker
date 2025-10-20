import { getPool } from '../../db/connection';
import axios from 'axios';

export async function autoMapSonarProjectKeys() {
  const pool = getPool();
  // Fetch all SonarCloud projects
  const sonarUrl = process.env.SONARQUBE_URL || '';
  const sonarToken = process.env.SONARQUBE_TOKEN || '';
  const sonarOrg = process.env.SONARQUBE_ORGANIZATION || '';
  
  if (!sonarOrg) {
    console.warn('⚠️ SONARQUBE_ORGANIZATION not set in .env. Skipping auto-mapping.');
    return;
  }
  
  const projects: { key: string; name: string }[] = [];
  let page = 1;
  const pageSize = 500;
  let total = 0;
  
  try {
    do {
      const url = `${sonarUrl}/api/components/search?qualifiers=TRK&organization=${sonarOrg}&p=${page}&ps=${pageSize}`;
      const resp = await axios.get(url, {
        headers: {
          Authorization: 'Basic ' + Buffer.from(sonarToken + ':').toString('base64'),
        },
      });
      const data = resp.data;
      if (data.components && Array.isArray(data.components)) {
        for (const c of data.components) {
          projects.push({ key: c.key, name: c.name });
        }
      }
      total = data.paging ? data.paging.total : projects.length;
      page++;
    } while (projects.length < total);
  } catch (error: any) {
    console.error('Failed to fetch SonarCloud projects:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    throw error;
  }

  // Fetch all local projects
  const dbProjects = await pool.query('SELECT id, name FROM tracked_projects');

  // Print all SonarCloud project keys for debug
  console.log('All SonarCloud project keys:');
  projects.forEach(p => console.log(`  ${p.key} (name: ${p.name})`));

  function normalize(str: string) {
    return str.replace(/[-_]/g, '').trim().toLowerCase();
  }
  
  for (const dbProject of dbProjects.rows) {
    const dbNorm = normalize(dbProject.name);
    
    // Try to find match by name or key
    let match = projects.find(
      p => normalize(p.name) === dbNorm || normalize(p.key) === dbNorm
    );
    
    // If no match, try to find if the SonarCloud key ends with the DB project name
    if (!match) {
      match = projects.find(p => {
        const keyNorm = normalize(p.key);
        return keyNorm.endsWith(dbNorm) || keyNorm.includes(dbNorm);
      });
    }
    
    if (match) {
      await pool.query(
        'UPDATE tracked_projects SET sonar_project_key = $1 WHERE id = $2',
        [match.key, dbProject.id]
      );
      console.log(`✅ Mapped DB project '${dbProject.name}' to SonarCloud key '${match.key}'`);
    } else {
      console.warn(`⚠️ No SonarCloud match for DB project '${dbProject.name}'.`);
    }
  }
}

// Helper function to get SonarCloud project key from database
export async function getSonarProjectKey(projectId: number): Promise<string | null> {
  const pool = getPool();
  const result = await pool.query(
    'SELECT sonar_project_key FROM tracked_projects WHERE id = $1',
    [projectId]
  );
  if (result.rows.length > 0 && result.rows[0].sonar_project_key) {
    return result.rows[0].sonar_project_key;
  }
  return null;
}
