// TODO

import { type Actor, ActorModel } from "../db/schema.ts";

// import { Effect } from "effect";
// import { none } from "effect/Option";

// const make = Effect.gen(function () {
//     const getUserInfo = () => [4, 5, 6];

//     return { getUserInfo } as const;
// });

// const x = function*() {};

export async function getUsers(): Promise<Actor[]> {
    return await ActorModel.find({ type: "user" });
}