import { atom } from "recoil";

export const currentposeState = atom({
  key: "currentposeState",
  default: {
    currentPose: "Tree",
  },
});
