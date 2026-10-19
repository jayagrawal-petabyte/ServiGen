import TeamIncidentTable from "./TeamIncidentTable";

function FirstLineLive() {
  return (
    <div className="relative w-full h-full flex flex-col">
      <TeamIncidentTable team="1st Line Support" mode="Live" />
    </div>
  );
}

export default FirstLineLive;
