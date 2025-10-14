# GitLab Integration Setup

## Getting Your GitLab Personal Access Token

1. **Go to GitLab**: Navigate to [https://gitlab.com](https://gitlab.com)

2. **Access Settings**:
   - Click on your profile picture (top right)
   - Select **Preferences**
   - In the left sidebar, click **Access Tokens**

3. **Create a New Token**:
   - **Token name**: `gitlab-tracker-api` (or any name you prefer)
   - **Expiration date**: Set as needed (optional)
   - **Select scopes**:
     - ✅ `read_api` - Read access to API
     - ✅ `read_user` - Read user information
     - ✅ `read_repository` - Read repository information
   
4. **Create Token**:
   - Click **Create personal access token**
   - **⚠️ IMPORTANT**: Copy the token immediately! You won't be able to see it again.

5. **Add to Your `.env` File**:
   ```env
   GITLAB_TOKEN=glpat-xxxxxxxxxxxxxxxxxxxx
   ```

## Environment Variables

Update your `server/.env` file:

```env
PORT=5000
CLIENT_URL=http://localhost:8080

# GitLab Configuration
GITLAB_URL=https://gitlab.com
GITLAB_TOKEN=glpat-your_actual_token_here
```

## API Endpoints

### Get All Projects
```
GET /api/projects
```
Fetches all projects owned by you from GitLab.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 12345,
      "name": "my-project",
      "description": "Project description",
      "web_url": "https://gitlab.com/username/my-project",
      "last_activity_at": "2025-10-13T10:00:00.000Z",
      "star_count": 5,
      "forks_count": 2,
      ...
    }
  ],
  "message": "Retrieved 10 projects successfully"
}
```

### Get Project by ID
```
GET /api/projects/:id
```
Fetches a specific project by its GitLab ID.

### Search Projects
```
GET /api/projects/search?q=search-term
```
Search your projects by name.

### Get Projects with Statistics
```
GET /api/projects/stats
```
Fetches projects with additional statistics.

## Testing the Integration

1. **Install axios** (if not already installed):
   ```bash
   cd server
   npm install
   ```

2. **Start the server**:
   ```bash
   npm run dev
   ```

3. **Test with curl** or Postman:
   ```bash
   curl http://localhost:5000/api/projects
   ```

## Troubleshooting

### Token Not Working
- Verify the token has the correct scopes
- Check if the token has expired
- Ensure the token is correctly copied in `.env`

### No Projects Returned
- Verify you have projects in your GitLab account
- Check if the token has `read_api` permission
- Look at server logs for detailed error messages

### Connection Error
- Verify `GITLAB_URL` is correct
- Check your internet connection
- Ensure GitLab is accessible
