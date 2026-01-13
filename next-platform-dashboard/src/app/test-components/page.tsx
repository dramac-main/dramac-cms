import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";

export default function ComponentsTestPage() {
  return (
    <div className="p-8 space-y-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold">UI Components Test</h1>
      
      {/* Buttons */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Buttons</h2>
        <div className="flex flex-wrap gap-4">
          <Button>Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="success">Success</Button>
          <Button loading>Loading</Button>
          <Button disabled>Disabled</Button>
        </div>
        <div className="flex gap-4">
          <Button size="sm">Small</Button>
          <Button size="default">Default</Button>
          <Button size="lg">Large</Button>
          <Button size="xl">Extra Large</Button>
        </div>
      </section>
      
      {/* Form Fields */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Form Fields</h2>
        <div className="space-y-4 max-w-md">
          <div>
            <Label required>Email</Label>
            <Input placeholder="Enter your email" />
          </div>
          <div>
            <Label>With Error</Label>
            <Input placeholder="Invalid input" error />
          </div>
          <div>
            <Label>Message</Label>
            <Textarea placeholder="Type your message..." />
          </div>
        </div>
      </section>
      
      {/* Cards */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Cards</h2>
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Card Title</CardTitle>
              <CardDescription>Card description goes here</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Card content</p>
            </CardContent>
            <CardFooter>
              <Button>Action</Button>
            </CardFooter>
          </Card>
          <Card hover>
            <CardHeader>
              <CardTitle>Hoverable Card</CardTitle>
              <CardDescription>This card has hover effect</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>
      
      {/* Badges */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Badges</h2>
        <div className="flex flex-wrap gap-2">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="destructive">Destructive</Badge>
          <Badge variant="info">Info</Badge>
          <Badge variant="muted">Muted</Badge>
        </div>
      </section>
      
      {/* Avatars */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Avatars</h2>
        <div className="flex gap-4 items-center">
          <Avatar size="sm">
            <AvatarFallback>SM</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarFallback>DF</AvatarFallback>
          </Avatar>
          <Avatar size="lg">
            <AvatarFallback>LG</AvatarFallback>
          </Avatar>
          <Avatar size="xl">
            <AvatarImage src="https://github.com/shadcn.png" />
            <AvatarFallback>XL</AvatarFallback>
          </Avatar>
        </div>
      </section>
    </div>
  );
}
