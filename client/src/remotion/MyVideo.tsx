import { AbsoluteFill, useCurrentFrame } from "remotion";

export const MyVideo = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        backgroundColor: "white",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div style={{ fontSize: 80 }}>Frame: {frame}</div>
    </AbsoluteFill>
  );
};
