import PedalBoardAppClient from "@/components/PedalBoardAppClient";

export default function Page() {
  return (
    <>
      {/* SEO content invisible */}
      <div
        style={{
          position: "absolute",
          left: "-9999px",
          top: 0,
          width: "1px",
          height: "1px",
          overflow: "hidden",
        }}
      >
        <h1>Guitar Pedalboard Builder</h1>

        <p>
          Make Your Board is a free online pedalboard builder that lets you design
          your guitar pedalboard with realistic dimensions, drag and drop pedals,
          and export your setup in high quality.
        </p>

        <h2>Free Pedalboard Planner Online</h2>

        <ul>
          <li>Drag and drop pedals</li>
          <li>Realistic pedal sizes</li>
          <li>Power consumption calculation</li>
          <li>Export and share your pedalboard</li>
        </ul>
      </div>

      {/* APP */}
      <PedalBoardAppClient />
    </>
  );
}