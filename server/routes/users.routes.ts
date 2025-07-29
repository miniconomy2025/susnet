import { Effect, Layer, Schema, pipe } from "effect";
import { HttpRouter, HttpServerResponse } from "effect/platform";

const Params = Schema.Struct({
    id: Schema.String
});

export class UsersRouter extends HttpRouter.Tag("UsersRouter")<UsersRouter>() {};

// const GetUser = UsersRouter.use((router) => pipe(
//     UserService
//     Effect.flatMap((service) => router.get(
//         "/user",
//         Effect.gen(function* () {
//             return yield* HttpServerResponse.json([1, 2, 3]);
//         })
//     ).pipe(
//         Effect.catchTags({
//             ParseError: err => HttpServerResponse.json({})
//         })
//     ))
// ));

// export const UserRoutes = Layer.mergeAll(GetUser).pipe(Layer.provideMerge(UsersRouter.Live))