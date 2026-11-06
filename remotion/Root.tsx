import { Composition } from "remotion";
import { HelloWorld, helloWorldCompSchema } from "./HelloWorld";
import {
  ScienceStick,
  calculateScienceMetadata,
  type ScienceStickProps,
} from "./ScienceStick";

const scienceDefaults: ScienceStickProps = {
  title: "Science Short",
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

// Each <Composition> is an entry in the sidebar!

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        // You can take the "id" to render a video:
        // npx remotion render HelloWorld
        id="HelloWorld"
        component={HelloWorld}
        durationInFrames={800}
        fps={30}
        width={1920}
        height={1080}
        // You can override these props for each render:
        // https://www.remotion.dev/docs/parametrized-rendering
        schema={helloWorldCompSchema}
        defaultProps={{
          titleText: "Render Server Template",
          titleColor: "#000000",
          logoColor1: "#91EAE4",
          logoColor2: "#86A8E7",
        }}
      />
      <Composition
        id="ScienceStick"
        component={ScienceStick}
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
