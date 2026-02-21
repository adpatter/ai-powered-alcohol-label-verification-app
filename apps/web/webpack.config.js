import path from "node:path";

export default {
  entry: {
    index: "./src/index.ts",
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        type: "css",
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  output: {
    filename: "[name].js",
    path: path.resolve(import.meta.dirname, "dist/ai-powered-alcohol-label-verification-app/"),
    clean: true,
  },
};
