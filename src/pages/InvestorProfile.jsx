import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button, EmptyState } from "../components/ui";

export default function InvestorProfile() {
  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/investors" className="mb-5 inline-flex items-center gap-1.5 rounded-lg text-sm font-medium text-muted transition-colors hover:text-brand">
        <ArrowLeft size={14} /> Back to Discover Investors
      </Link>
      <EmptyState
        title="Investor not found"
        hint="This investor profile is not available. Matches will appear once your startup profile is verified."
        action={
          <Link to="/investors">
            <Button variant="soft">View all investors</Button>
          </Link>
        }
      />
    </div>
  );
}
