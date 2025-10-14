import { LayoutDashboard, FolderGit2, Star, Settings, Bell, BarChart3 } from "lucide-react";
import { NavLink } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "All Projects", url: "/projects", icon: FolderGit2 },
  { title: "Tracked Projects", url: "/tracked", icon: Star },
  { title: "Project Insights", url: "/insights", icon: BarChart3 },
  { title: "Tracking Management", url: "/tracking", icon: Settings },
  { title: "Alerts", url: "/alerts", icon: Bell },
];

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className="p-4 border-b">
          <h2 className="font-bold text-lg">GitLab Tracker</h2>
        </div>
        
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end={item.url === "/"}
                      style={{ color: 'inherit' }}
                      className={({ isActive }) =>
                        isActive 
                          ? "bg-accent text-accent-foreground font-medium flex items-center gap-3 cursor-pointer [&]:text-foreground" 
                          : "text-foreground hover:bg-muted/50 hover:text-foreground flex items-center gap-3 cursor-pointer [&]:text-foreground"
                      }
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
