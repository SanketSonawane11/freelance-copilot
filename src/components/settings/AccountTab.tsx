
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Upload } from "lucide-react";

interface AccountTabProps {
  user: any;
  localProfile: any;
  setLocalProfile: (profile: any) => void;
  handleProfileUpdate: (updates: any) => void;
  handleAvatarUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isUploading: boolean;
}

export const AccountTab: React.FC<AccountTabProps> = ({
  user,
  localProfile,
  setLocalProfile,
  handleProfileUpdate,
  handleAvatarUpload,
  isUploading,
}) => {
  return (
    <Card className="backdrop-blur-xl bg-white/40 border-white/20 shadow-lg shadow-purple-500/5">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <User className="w-5 h-5" />
          <span>Account Information</span>
        </CardTitle>
        <CardDescription>Manage your personal details and profile</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center space-x-6">
          <div className="relative">
            <Avatar className="w-20 h-20">
              <AvatarImage src={localProfile.profile_picture || undefined} />
              <AvatarFallback className="bg-gradient-to-r from-blue-400 to-purple-400 text-white text-lg">
                {localProfile.name?.charAt(0) || user?.email?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <label htmlFor="avatar-upload" className="absolute -bottom-2 -right-2 bg-white rounded-full p-2 shadow-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <Upload className="w-4 h-4" />
            </label>
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
              disabled={isUploading}
            />
          </div>
          <div className="flex-1 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={localProfile.name || ''}
                  onChange={(e) => setLocalProfile((prev: any) => ({ ...prev, name: e.target.value }))}
                  onBlur={() => handleProfileUpdate({ name: localProfile.name })}
                  className="bg-white/50"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={user?.email || ''}
                  disabled
                  className="bg-gray-100/50"
                />
              </div>
            </div>
            <div>
              <Label>Login Method</Label>
              <div className="mt-2">
                <Badge variant="outline">{localProfile.login_method || 'Email'}</Badge>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
