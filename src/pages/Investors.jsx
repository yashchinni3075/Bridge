import { Search } from "lucide-react";
import { Link } from "react-router-dom";
import { Button, EmptyState, PageHead } from "../components/ui";

export default function Investors() {
  return (
    <div>
      <PageHead title="Discover Investors" subtitle="AI-ranked by sector, stage, and check-size fit." />
      <EmptyState
        icon={Search}
        title="No investors available"
        hint="Once your profile is verified, investor matches will appear here based on your sector, stage, and funding needs."
        action={
          <Link to="/profile/edit">
            <Button variant="soft">Complete your profile</Button>
          </Link>
        }
      />
    </div>
  );
}
