import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button, EmptyState } from "../components/ui";

export default function TeammateProfile() {
  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/teammates" className="mb-5 inline-flex items-center gap-1.5 rounded-lg text-sm font-medium text-muted transition-colors hover:text-brand">
        <ArrowLeft size={14} /> Back to Find Teammates
      </Link>
      <EmptyState
        title="Profile not found"
        hint="This teammate profile is not available. Matches will appear once your startup profile is verified."
        action={
          <Link to="/teammates">
            <Button variant="soft">View all teammates</Button>
          </Link>
        }
      />
    </div>
  );
}
