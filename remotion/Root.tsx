import { Composition } from "remotion";
import { HelloWorld, helloWorldCompSchema } from "./HelloWorld";
import {
  calculateScienceMetadata,
  type ScienceStickProps,
} from "./ScienceStick";
import { ScienceWorld } from "./ScienceWorld";

const scienceDefaults: ScienceStickProps = {
  title: "Science Explainer",
  music: "mysterious",
  scenes: [
    {
      narration: "Time really does slow down near a black hole.",
      headline: "TIME SLOWS DOWN",
      pose: "shocked",
      icons: ["clock", "blackhole"],
      bg: "space",
      voiceUrl: "",
      sfx: "boom",
    },
  ],
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="HelloWorld"
        component={HelloWorld}
        durationInFrames={800}
        fps={30}
        width={1920}
        height={1080}
        schema={helloWorldCompSchema}
        defaultProps={{
          titleText: "Render Server Template",
          titleColor: "#000000",
          logoColor1: "#91EAE4",
          logoColor2: "#86A8E7",
        }}
      />
      {/* Keep the existing composition ID and input schema so n8n requests remain compatible. */}
      <Composition
        id="ScienceStick"
        component={ScienceWorld}
        durationInFrames={900}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={scienceDefaults}
        calculateMetadata={calculateScienceMetadata}
      />
    </>
  );
};
