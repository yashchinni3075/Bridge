import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { Button, EmptyState, PageHead } from "../components/ui";

export default function Teammates() {
  return (
    <div>
      <PageHead title="Find Teammates" subtitle="Freelancers and co-founders matched to your open roles." />
      <EmptyState
        icon={Search}
        title="No teammates available"
        hint="Once your profile is verified, teammate matches will appear here to help close your skill gaps."
        action={
          <Link to="/profile/edit">
            <Button variant="soft">Complete your profile</Button>
          </Link>
        }
      />
    </div>
  );
}
