import { FileQuestion, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-4">
      <Card className="mx-auto max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted mb-4">
            <FileQuestion className="h-10 w-10 text-muted-foreground" />
          </div>
          <CardTitle className="text-4xl font-bold">404</CardTitle>
          <CardDescription className="text-xl">Page not found</CardDescription>
        </CardHeader>
        
        <CardContent>
          <p className="text-center text-muted-foreground">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
            Please check the URL or navigate back to the dashboard.
          </p>
        </CardContent>
        
        <CardFooter className="flex flex-col sm:flex-row gap-2 justify-center">
          <Button variant="outline" asChild className="w-full sm:w-auto">
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go back
            </Link>
          </Button>
          <Button asChild className="w-full sm:w-auto">
            <Link href="/dashboard">
              <Home className="mr-2 h-4 w-4" />
              Dashboard
            </Link>
          </Button>
        </CardFooter>
      </Card>
      
      <div className="mt-8 text-center">
        <p className="text-sm text-muted-foreground mb-4">
          Looking for something specific?
        </p>
        <div className="flex flex-wrap justify-center gap-4 text-sm">
          <Link 
            href="/dashboard/clients" 
            className="text-primary hover:underline"
          >
            Clients
          </Link>
          <Link 
            href="/dashboard/sites" 
            className="text-primary hover:underline"
          >
            Sites
          </Link>
          <Link 
            href="/settings" 
            className="text-primary hover:underline"
          >
            Settings
          </Link>
        </div>
      </div>
    </div>
  );
}
