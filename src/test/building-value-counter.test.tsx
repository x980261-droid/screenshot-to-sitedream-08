import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { BuildingValueCounter } from "@/components/BuildingValueCounter";

it("shows the deformation percentage while below 100%", () => {
  render(<BuildingValueCounter elapsedSeconds={90} />);
  expect(screen.getByText(/Динамика деформаций 50%/)).toBeInTheDocument();
  expect(screen.queryByText("Здание признано аварийным")).not.toBeInTheDocument();
});

it("replaces deformation with the emergency notice at 100%", () => {
  render(<BuildingValueCounter elapsedSeconds={180} />);
  expect(screen.getByText("Здание признано аварийным")).toBeInTheDocument();
  expect(screen.queryByText(/Динамика деформаций/)).not.toBeInTheDocument();
});
