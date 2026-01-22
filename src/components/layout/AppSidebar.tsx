import { 
  Search, 
  Heart, 
  Clock, 
  User, 
  Ship, 
  LogIn, 
  LogOut,
  Anchor,
  Settings,
  HelpCircle
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarSeparator,
  useSidebar,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

const mainNavItems = [
  { title: 'Busca Inteligente', url: '/', icon: Search },
  { title: 'Meus Favoritos', url: '/favoritos', icon: Heart },
  { title: 'Meus Passeios', url: '/passeios', icon: Clock },
  { title: 'Minha Conta', url: '/conta', icon: User },
];

const ownerNavItems = [
  { title: 'Painel do Proprietário', url: '/dashboard', icon: Ship },
];

const footerNavItems = [
  { title: 'Configurações', url: '/configuracoes', icon: Settings },
  { title: 'Ajuda', url: '/ajuda', icon: HelpCircle },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const collapsed = state === 'collapsed';

  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar 
      className="border-r border-border/50 bg-sidebar"
      collapsible="icon"
    >
      {/* Header */}
      <SidebarHeader className="p-4">
        <NavLink to="/" className="flex items-center gap-3 group">
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30 flex items-center justify-center group-hover:glow transition-all duration-300">
            <Anchor className="w-5 h-5 text-primary" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-display font-bold text-foreground gradient-text">
                NauticaMarket
              </span>
              <span className="text-xs text-muted-foreground">
                Experiências Náuticas
              </span>
            </div>
          )}
        </NavLink>
      </SidebarHeader>

      <SidebarSeparator className="bg-border/30" />

      <SidebarContent className="px-2">
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground text-xs uppercase tracking-wider px-2">
            {!collapsed && 'Navegação'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={collapsed ? item.title : undefined}
                  >
                    <NavLink
                      to={item.url}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200',
                        isActive(item.url)
                          ? 'bg-primary/10 text-primary border border-primary/20'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                      )}
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      {!collapsed && <span className="font-medium">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="bg-border/30 my-2" />

        {/* Owner Section */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground text-xs uppercase tracking-wider px-2">
            {!collapsed && 'Proprietário'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {ownerNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={collapsed ? item.title : undefined}
                  >
                    <NavLink
                      to={item.url}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200',
                        isActive(item.url)
                          ? 'bg-accent/10 text-accent border border-accent/20'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                      )}
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      {!collapsed && <span className="font-medium">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2">
        <SidebarSeparator className="bg-border/30 mb-2" />
        <SidebarMenu>
          {footerNavItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                tooltip={collapsed ? item.title : undefined}
              >
                <NavLink
                  to={item.url}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200"
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  {!collapsed && <span className="text-sm">{item.title}</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
          
          {/* Login/Logout Button */}
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip={collapsed ? 'Entrar' : undefined}
            >
              <NavLink
                to="/login"
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-primary hover:bg-primary/10 transition-all duration-200"
              >
                <LogIn className="w-4 h-4 flex-shrink-0" />
                {!collapsed && <span className="text-sm font-medium">Entrar</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
