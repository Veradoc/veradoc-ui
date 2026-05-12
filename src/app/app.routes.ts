import { Routes } from '@angular/router';

import { LayoutComponent } from './layout/layout.component';
import { LoginComponent } from './pages/login/login.component';
import { ConversationComponent } from './pages/conversation/conversation.component';
import { ChatsComponent } from './pages/chats/chats.component';
import { CollectionsComponent } from './pages/collections/collections.component';
import { FilesComponent } from './pages/files/files.component';
import { UsersComponent } from './pages/users/users.component';
import { ModelsComponent } from './pages/models/models.component';
import { ContainersComponent } from './pages/containers/containers.component';
import { SettingsComponent } from './pages/settings/settings.component';
import { guestGuard } from './services/guest.guard';

import { authGuard } from './services/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent, canActivate: [guestGuard] },
  { 
    path: '', 
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'conversation', component: ConversationComponent },
      { path: 'chats', component: ChatsComponent },
      { path: 'collections', component: CollectionsComponent },
      { path: 'files/:collectionName', component: FilesComponent },
      { path: 'users', component: UsersComponent },
      { path: 'models', component: ModelsComponent },
      { path: 'containers', component: ContainersComponent },
      { path: 'settings', component: SettingsComponent },
      { path: '', redirectTo: 'conversation', pathMatch: 'full' },      
    ]
  },
  { path: '**', redirectTo: 'login'}
];
