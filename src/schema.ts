import * as v from 'valibot';

export const OptionsSchema = v.object({
  ui: v.optional(v.boolean()),
  storybookStart: v.optional(v.union([v.string(), v.boolean()])),
  config: v.optional(v.string()),
  debug: v.optional(v.boolean()),
  port: v.number(),
  failFast: v.optional(v.boolean()),
  reportDir: v.optional(v.string()),
  screenDir: v.optional(v.string()),
  storybookUrl: v.optional(v.string()),
  storybookPort: v.optional(v.number()),
  reporter: v.optional(v.string()),
  odiff: v.optional(v.boolean()),
  trace: v.optional(v.boolean()),
  docker: v.optional(v.boolean()),
});

export const WorkerOptionsSchema = v.object({
  browser: v.string(),
  storybookUrl: v.string(),
  gridUrl: v.optional(v.string()),
  config: v.optional(v.string()),
  debug: v.optional(v.boolean()),
  trace: v.optional(v.boolean()),
  reportDir: v.optional(v.string()),
  screenDir: v.optional(v.string()),
  odiff: v.optional(v.boolean()),
  port: v.number(),
});

export type Options = v.InferOutput<typeof OptionsSchema>;
export type WorkerOptions = v.InferOutput<typeof WorkerOptionsSchema>;
