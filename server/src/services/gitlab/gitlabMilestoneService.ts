import gitlabClient from './gitlabClient';
import { GitLabMilestone } from '../../types';

class GitLabMilestoneService {
    /**
     * Get only open (active and not expired) milestones for a specific project
     * Filters out expired milestones (past due_date)
     */
    getProjectMilestones = async (projectId: number): Promise<GitLabMilestone[]> => {
        try {
            const client = gitlabClient.getClient();
            const response = await client.get(`/projects/${projectId}/milestones`, {
                params: {
                    state: 'active', // Get active milestones
                    order_by: 'updated_at',
                    sort: 'desc',
                    per_page: 100,
                }
            });
            
            const milestones = response.data as GitLabMilestone[];
            const now = new Date();
            
            // Filter out expired milestones (due_date is in the past)
            return milestones.filter(milestone => {
                if (!milestone.due_date) {
                    // No due date = not expired, keep it
                    return true;
                }
                
                const dueDate = new Date(milestone.due_date);
                // Keep only milestones that are not expired (due date is in future or today)
                return dueDate >= now;
            });
        } catch (error) {
            console.error('Error fetching project milestones:', error);
            throw error;
        }
    };
}

export default new GitLabMilestoneService();
