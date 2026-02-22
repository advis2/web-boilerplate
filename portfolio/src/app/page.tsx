"use client";

import { Typography, Button } from "@mui/material";
import "./global.css";
import { RoundBox } from "./RoundBox";
import { GlobalLayout } from "./layout";

export default function HomePage() {
  return (
    <GlobalLayout>
      <div className="container">
        <RoundBox>
          <Typography variant="h3" gutterBottom>
            Welcome to My Portfolio
          </Typography>

          <Typography variant="body1" color="text.secondary">
            This is a clean homepage layout without WASM code.
          </Typography>

          <Button variant="contained" color="primary" sx={{ mt: 3 }}>
            Explore Projects
          </Button>
        </RoundBox>
      </div>
    </GlobalLayout>
  );
}
