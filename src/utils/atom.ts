import {atom} from "recoil";
import {v4 as uuidv4} from "uuid";

export const roomValueState = atom({
  key: `roomValueState${uuidv4()}`,
  default: "",
});
