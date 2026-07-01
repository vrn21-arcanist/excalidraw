import {
  CODES,
  DEFAULT_GRID_SIZE,
  KEYS,
  MOBILE_ACTION_BUTTON_BG,
  arrayToMap,
} from "@excalidraw/common";

import { getNonDeletedElements } from "@excalidraw/element";

import { LinearElementEditor } from "@excalidraw/element";

import {
  getSelectedElements,
  getSelectionStateForElements,
} from "@excalidraw/element";

import { syncMovedIndices } from "@excalidraw/element";

import { duplicateElements } from "@excalidraw/element";

import { CaptureUpdateAction } from "@excalidraw/element";

import type { OrderedExcalidrawElement } from "@excalidraw/element/types";

import { ToolButton } from "../components/ToolButton";
import { DuplicateIcon } from "../components/icons";

import { t } from "../i18n";
import { isSomeElementSelected } from "../scene";
import { getShortcutKey } from "../shortcut";

import { useStylesPanelMode } from "../components/App";

import { register } from "./register";

import type { AppClassProperties, AppState } from "../types";

const duplicateSelection = ({
  elements,
  appState,
  app,
  offset,
  includeSelectedLinearPointDuplication,
}: {
  elements: readonly OrderedExcalidrawElement[];
  appState: Readonly<AppState>;
  app: AppClassProperties;
  offset: { x: number; y: number };
  includeSelectedLinearPointDuplication: boolean;
}) => {
  if (appState.selectedElementsAreBeingDragged) {
    return false;
  }

  // duplicate selected point(s) if editing a line
  if (
    includeSelectedLinearPointDuplication &&
    appState.selectedLinearElement?.isEditing
  ) {
    // TODO: Invariants should be checked here instead of duplicateSelectedPoints()
    try {
      const newAppState = LinearElementEditor.duplicateSelectedPoints(
        appState,
        app.scene,
      );

      return {
        elements,
        appState: newAppState,
        captureUpdate: CaptureUpdateAction.IMMEDIATELY,
      };
    } catch {
      return false;
    }
  }

  let { duplicatedElements, elementsWithDuplicates } = duplicateElements({
    type: "in-place",
    elements,
    idsOfElementsToDuplicate: arrayToMap(
      getSelectedElements(elements, appState, {
        includeBoundTextElement: true,
        includeElementsInFrames: true,
      }),
    ),
    appState,
    randomizeSeed: true,
    overrides: ({ origElement, origIdToDuplicateId }) => {
      const duplicateFrameId =
        origElement.frameId && origIdToDuplicateId.get(origElement.frameId);
      return {
        x: origElement.x + offset.x,
        y: origElement.y + offset.y,
        frameId: duplicateFrameId ?? origElement.frameId,
      };
    },
  });

  if (app.props.onDuplicate && elementsWithDuplicates) {
    const mappedElements = app.props.onDuplicate(
      elementsWithDuplicates,
      elements,
    );
    if (mappedElements) {
      elementsWithDuplicates = mappedElements;
    }
  }

  return {
    elements: syncMovedIndices(
      elementsWithDuplicates,
      arrayToMap(duplicatedElements),
    ),
    appState: {
      ...appState,
      ...getSelectionStateForElements(
        duplicatedElements,
        getNonDeletedElements(elementsWithDuplicates),
        appState,
      ),
    },
    captureUpdate: CaptureUpdateAction.IMMEDIATELY,
  };
};

export const actionDuplicateSelection = register({
  name: "duplicateSelection",
  label: "labels.duplicateSelection",
  icon: DuplicateIcon,
  trackEvent: { category: "element" },
  perform: (elements, appState, formData, app) =>
    duplicateSelection({
      elements,
      appState,
      app,
      offset: {
        x: DEFAULT_GRID_SIZE / 2,
        y: DEFAULT_GRID_SIZE / 2,
      },
      includeSelectedLinearPointDuplication: true,
    }),
  keyTest: (event) => event[KEYS.CTRL_OR_CMD] && event.key === KEYS.D,
  PanelComponent: ({ elements, appState, updateData, app }) => {
    const isMobile = useStylesPanelMode() === "mobile";

    return (
      <ToolButton
        type="button"
        icon={DuplicateIcon}
        title={`${t("labels.duplicateSelection")} — ${getShortcutKey(
          "CtrlOrCmd+D",
        )}`}
        aria-label={t("labels.duplicateSelection")}
        onClick={() => updateData(null)}
        disabled={
          !isSomeElementSelected(getNonDeletedElements(elements), appState)
        }
        style={{
          ...(isMobile && appState.openPopup !== "compactOtherProperties"
            ? MOBILE_ACTION_BUTTON_BG
            : {}),
        }}
      />
    );
  },
});

export const actionDuplicateSelectionToRight = register({
  name: "duplicateSelectionToRight",
  label: "labels.duplicateSelectionToRight",
  icon: DuplicateIcon,
  trackEvent: { category: "element" },
  perform: (elements, appState, formData, app) =>
    duplicateSelection({
      elements,
      appState,
      app,
      offset: {
        x: DEFAULT_GRID_SIZE / 2,
        y: 0,
      },
      includeSelectedLinearPointDuplication: false,
    }),
  keyTest: (event) =>
    !event[KEYS.CTRL_OR_CMD] &&
    event.altKey &&
    !event.shiftKey &&
    event.code === CODES.D,
});
