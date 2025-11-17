import { useState, useEffect } from "react";
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, User, BookOpen, Trash2, LayoutDashboard } from "lucide-react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback } from "./ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";
import { useAxios } from "../lib/axios";

import { ThemeToggle } from "./ThemeToggle";

interface User {
  _id: string; // MongoDB user ID
  sub?: string;
  name?: string;
  email?: string;
}

interface NavbarProps {
  user: User | null;
  onGetStarted: () => void;
  onSignIn: () => void;
  onSignOut: () => void;
}

export default function Navbar({ onGetStarted, onSignIn, onSignOut, user }: NavbarProps) {
  const navigate = useNavigate();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const axios = useAxios();

  useEffect(() => {
    if (user?.email) {
      const adminEmails = import.meta.env.VITE_ADMIN_EMAILS || [];
      setIsAdmin(adminEmails.includes(user.email));
    }
  }, [user?.email]);

  const handleDeleteAccount = async () => {
    if (!user?._id) return;
    try {
      await axios.delete(`/users/${user._id}`);
      onSignOut(); // Log out user after successful deletion
    } catch (error) {
      console.error("Error deleting account:", error);
      alert("Failed to delete account. Please try again.");
    }
  };

  
  return (
    <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Brand */}
          <Link to="/" className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-lg">
              <BookOpen className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">My Research Digest</h2>
              <p className="text-xs text-muted-foreground">AI-powered scientific newsletters</p>
            </div>
          </Link>

          {/* User Menu */}
          {user ? (
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {user?.name? user.name.split(' ').map(n => n[0]).join('').toUpperCase(): <User className="h-6 w-6" />}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">{user.name}</p>
                      <p className="w-[200px] truncate text-sm text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  {isAdmin && (
                    <DropdownMenuItem onClick={() => navigate('/admin')}>
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      <span>Admin Dashboard</span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={onSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}> {/* Prevent dropdown from closing immediately */}
                        <Trash2 className="mr-2 h-4 w-4 text-destructive" />
                        <span className="text-destructive">Delete account</span>
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete your account
                          and remove your data from our servers, including all your newsletters, issues, and papers.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <ThemeToggle />
              {/* <Button variant="ghost" onClick={onSignIn}>Sign In</Button> */}
              {/* <Button onClick={onGetStarted}>Sign Up</Button> */}
              <Button onClick={onSignIn}>Sign In</Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
