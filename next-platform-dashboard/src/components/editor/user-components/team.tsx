"use client";

import { useNode } from "@craftjs/core";
import { Plus, Minus, Linkedin, Twitter, Mail } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  image: string;
  twitter?: string;
  linkedin?: string;
  email?: string;
}

interface TeamProps {
  title: string;
  subtitle: string;
  members: TeamMember[];
  columns: 2 | 3 | 4;
  style: "cards" | "minimal" | "bordered";
  showSocial: boolean;
  showBio: boolean;
}

const defaultProps: TeamProps = {
  title: "Meet Our Team",
  subtitle: "The passionate people behind our success",
  members: [
    {
      id: "1",
      name: "Sarah Johnson",
      role: "CEO & Founder",
      bio: "With over 15 years of industry experience, Sarah leads our vision and strategy.",
      image: "https://placehold.co/300x300?text=SJ",
      linkedin: "#",
      twitter: "#",
    },
    {
      id: "2",
      name: "Michael Chen",
      role: "CTO",
      bio: "Michael brings technical excellence and innovation to everything we build.",
      image: "https://placehold.co/300x300?text=MC",
      linkedin: "#",
    },
    {
      id: "3",
      name: "Emily Rodriguez",
      role: "Design Director",
      bio: "Emily transforms ideas into beautiful, user-centered designs.",
      image: "https://placehold.co/300x300?text=ER",
      linkedin: "#",
      twitter: "#",
    },
  ],
  columns: 3,
  style: "cards",
  showSocial: true,
  showBio: true,
};

export function Team(props: Partial<TeamProps>) {
  const { title, subtitle, members, columns, style, showSocial, showBio } = {
    ...defaultProps,
    ...props,
  };
  
  const {
    connectors: { connect, drag },
    selected,
  } = useNode((state) => ({
    selected: state.events.selected,
  }));

  const columnClasses = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  };

  const cardStyles = {
    cards: "bg-white rounded-xl shadow-sm p-6 text-center",
    minimal: "text-center",
    bordered: "border rounded-xl p-6 text-center",
  };

  return (
    <section
      ref={(ref) => {
        if (ref) {
          connect(drag(ref));
        }
      }}
      className={`py-16 px-4 ${selected ? "ring-2 ring-primary ring-offset-2" : ""}`}
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">{title}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">{subtitle}</p>
        </div>

        <div className={`grid ${columnClasses[columns]} gap-8`}>
          {members.map((member) => (
            <div key={member.id} className={cardStyles[style]}>
              <img
                src={member.image}
                alt={member.name}
                className="w-32 h-32 rounded-full mx-auto mb-4 object-cover"
              />
              <h3 className="text-xl font-semibold">{member.name}</h3>
              <p className="text-primary font-medium mb-2">{member.role}</p>
              
              {showBio && (
                <p className="text-muted-foreground text-sm mb-4">{member.bio}</p>
              )}
              
              {showSocial && (
                <div className="flex justify-center gap-3">
                  {member.linkedin && (
                    <a
                      href={member.linkedin}
                      className="text-muted-foreground hover:text-primary transition-colors"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Linkedin className="h-5 w-5" />
                    </a>
                  )}
                  {member.twitter && (
                    <a
                      href={member.twitter}
                      className="text-muted-foreground hover:text-primary transition-colors"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Twitter className="h-5 w-5" />
                    </a>
                  )}
                  {member.email && (
                    <a
                      href={`mailto:${member.email}`}
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Mail className="h-5 w-5" />
                    </a>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Settings Panel
function TeamSettings() {
  const {
    actions: { setProp },
    props,
  } = useNode((node) => ({
    props: node.data.props as TeamProps,
  }));

  const addMember = () => {
    setProp((props: TeamProps) => {
      props.members = [
        ...props.members,
        {
          id: Date.now().toString(),
          name: "New Team Member",
          role: "Role Title",
          bio: "Add a brief bio here...",
          image: "https://placehold.co/300x300?text=NEW",
        },
      ];
    });
  };

  const removeMember = (id: string) => {
    setProp((props: TeamProps) => {
      props.members = props.members.filter((m) => m.id !== id);
    });
  };

  const updateMember = (id: string, field: keyof TeamMember, value: string) => {
    setProp((props: TeamProps) => {
      const member = props.members.find((m) => m.id === id);
      if (member) {
        (member as unknown as Record<string, string>)[field] = value;
      }
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Section Title</Label>
        <Input
          value={props.title || ""}
          onChange={(e) => setProp((p: TeamProps) => (p.title = e.target.value))}
        />
      </div>

      <div>
        <Label>Subtitle</Label>
        <Textarea
          value={props.subtitle || ""}
          onChange={(e) => setProp((p: TeamProps) => (p.subtitle = e.target.value))}
          rows={2}
        />
      </div>

      <div>
        <Label>Columns</Label>
        <Select
          value={props.columns?.toString() || "3"}
          onValueChange={(v) =>
            setProp((p: TeamProps) => (p.columns = parseInt(v) as 2 | 3 | 4))
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2">2 Columns</SelectItem>
            <SelectItem value="3">3 Columns</SelectItem>
            <SelectItem value="4">4 Columns</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Style</Label>
        <Select
          value={props.style || "cards"}
          onValueChange={(v) =>
            setProp((p: TeamProps) => (p.style = v as TeamProps["style"]))
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cards">Cards</SelectItem>
            <SelectItem value="minimal">Minimal</SelectItem>
            <SelectItem value="bordered">Bordered</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="showBio"
          checked={props.showBio ?? true}
          onChange={(e) => setProp((p: TeamProps) => (p.showBio = e.target.checked))}
          className="h-4 w-4 rounded border-gray-300"
        />
        <Label htmlFor="showBio">Show Bio</Label>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="showSocial"
          checked={props.showSocial ?? true}
          onChange={(e) =>
            setProp((p: TeamProps) => (p.showSocial = e.target.checked))
          }
          className="h-4 w-4 rounded border-gray-300"
        />
        <Label htmlFor="showSocial">Show Social Links</Label>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label>Team Members ({props.members?.length || 0})</Label>
          <Button size="sm" onClick={addMember}>
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>

        <div className="max-h-80 overflow-y-auto space-y-3">
          {props.members?.map((member, index) => (
            <div key={member.id} className="border rounded p-3 space-y-2">
              <div className="flex justify-between items-start">
                <span className="text-xs text-muted-foreground">
                  Member {index + 1}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeMember(member.id)}
                  className="h-6 w-6 p-0"
                  disabled={props.members.length <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
              </div>
              <Input
                value={member.name}
                onChange={(e) => updateMember(member.id, "name", e.target.value)}
                placeholder="Name"
              />
              <Input
                value={member.role}
                onChange={(e) => updateMember(member.id, "role", e.target.value)}
                placeholder="Role"
              />
              <Input
                value={member.image}
                onChange={(e) => updateMember(member.id, "image", e.target.value)}
                placeholder="Image URL"
              />
              <Textarea
                value={member.bio}
                onChange={(e) => updateMember(member.id, "bio", e.target.value)}
                placeholder="Bio"
                rows={2}
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  value={member.linkedin || ""}
                  onChange={(e) => updateMember(member.id, "linkedin", e.target.value)}
                  placeholder="LinkedIn URL"
                />
                <Input
                  value={member.twitter || ""}
                  onChange={(e) => updateMember(member.id, "twitter", e.target.value)}
                  placeholder="Twitter URL"
                />
              </div>
              <Input
                value={member.email || ""}
                onChange={(e) => updateMember(member.id, "email", e.target.value)}
                placeholder="Email"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

Team.craft = {
  props: defaultProps,
  related: {
    settings: TeamSettings,
  },
  displayName: "Team",
};
