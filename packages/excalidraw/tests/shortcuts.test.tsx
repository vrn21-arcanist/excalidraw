import React from "react";

import { CODES, DEFAULT_GRID_SIZE, KEYS } from "@excalidraw/common";

import { Excalidraw } from "../index";

import { API } from "./helpers/api";
import { Keyboard } from "./helpers/ui";
import { fireEvent, render, waitFor } from "./test-utils";

describe("shortcuts", () => {
  it("Clear canvas shortcut should display confirm dialog", async () => {
    await render(
      <Excalidraw
        initialData={{ elements: [API.createElement({ type: "rectangle" })] }}
        handleKeyboardGlobally
      />,
    );

    expect(window.h.elements.length).toBe(1);

    Keyboard.withModifierKeys({ ctrl: true }, () => {
      Keyboard.keyDown(KEYS.DELETE);
    });
    const confirmDialog = document.querySelector(".confirm-dialog")!;
    expect(confirmDialog).not.toBe(null);

    fireEvent.click(confirmDialog.querySelector('[aria-label="Confirm"]')!);

    await waitFor(() => {
      expect(window.h.elements[0].isDeleted).toBe(true);
    });
  });

  it("Alt+D duplicates the selection to the right", async () => {
    const rectangle = API.createElement({
      type: "rectangle",
      x: 15,
      y: 25,
    });

    await render(
      <Excalidraw
        initialData={{ elements: [rectangle] }}
        handleKeyboardGlobally
      />,
    );

    API.setSelectedElements([window.h.elements[0]]);

    Keyboard.withModifierKeys({ alt: true }, () => {
      Keyboard.codePress(CODES.D);
    });

    expect(window.h.elements).toHaveLength(2);
    expect(window.h.elements[1].x).toBe(rectangle.x + DEFAULT_GRID_SIZE / 2);
    expect(window.h.elements[1].y).toBe(rectangle.y);
    expect(window.h.state.selectedElementIds).toEqual({
      [window.h.elements[1].id]: true,
    });
  });
});
