/**
 * Highlight application utilities
 * Extracted and adapted from apply-highlight.md
 */

export interface TextMapEntry {
  node: Text;
  start: number;
  end: number;
}

export interface MatchPosition {
  map: TextMapEntry[];
  startOffset: number;
  endOffset: number;
}

export interface HighlightData {
  id: string;
  articleId: string;
  location: string;
  text: string;
  html?: string;
  markdown?: string;
  color?: string;
  createdAt: number;
  updatedAt?: number;
  createBy: "rehi-web" | "rehi-browser-extension";
  isDeleted: boolean;
}

export function applyDistributedHighlight(
  range: Range,
  color: string = "rgba(255, 235, 59, 0.6)", // Brighter default yellow
  highlightId?: string
) {
  const iterator = document.createNodeIterator(
    range.commonAncestorContainer,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        if (!node.nodeValue?.trim()) {
          return NodeFilter.FILTER_REJECT;
        }
        const nodeRange = document.createRange();
        nodeRange.selectNodeContents(node);
        return range.compareBoundaryPoints(Range.END_TO_START, nodeRange) < 0 &&
          range.compareBoundaryPoints(Range.START_TO_END, nodeRange) > 0
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_REJECT;
      },
    }
  );

  // Bước 1: Thu thập tất cả các nút cần sửa đổi vào một mảng tĩnh TRƯỚC.
  const nodesToWrap: Text[] = [];
  let node: Node | null;
  while ((node = iterator.nextNode())) {
    nodesToWrap.push(node as Text);
  }

  // Bước 2: Bây giờ, lặp qua mảng tĩnh và thay đổi DOM một cách an toàn.
  // Iterator đã kết thúc, nên việc này an toàn.
  for (const textNode of nodesToWrap) {
    const nodeRange = document.createRange();
    nodeRange.selectNodeContents(textNode);

    const startOffset =
      range.compareBoundaryPoints(Range.START_TO_START, nodeRange) > 0
        ? range.startOffset
        : 0;
    const endOffset =
      range.compareBoundaryPoints(Range.END_TO_END, nodeRange) < 0
        ? range.endOffset
        : (textNode.textContent ?? "").length;

    if (startOffset === endOffset) continue;

    try {
      const before = textNode.splitText(startOffset);
      // Tính toán lại độ dài của phần đã tách (offset)
      const after = before.splitText(endOffset - startOffset);

      const wrapper = document.createElement("article-highlight");
      wrapper.setAttribute("data-highlight", "true");
      if (highlightId) {
        wrapper.setAttribute("data-highlight-id", highlightId);
      }
      (wrapper as HTMLElement).style.backgroundColor = color;

      // Chèn thẻ bọc trước `before` (đoạn text đã được tách ra)
      before.parentNode?.insertBefore(wrapper, before);
      // Đưa đoạn text `before` vào bên trong thẻ bọc
      wrapper.appendChild(before);
    } catch (e) {
      // Khối catch này có thể ngăn một highlight lỗi làm hỏng toàn bộ
    }
  }
}

// Remove existing applied highlights to avoid duplicates before reapplying
export function clearAppliedHighlights(container: HTMLElement) {
  const nodes = Array.from(
    container.querySelectorAll("article-highlight[data-highlight='true']")
  );
  for (const el of nodes) {
    const parent = el.parentNode as Node & ParentNode;
    while (el.firstChild) parent.insertBefore(el.firstChild, el);
    parent.removeChild(el);
  }
}

/**
 * Lấy TẤT CẢ các text node, bao gồm cả các node chỉ chứa khoảng trắng.
 * @param container - The container element
 * @returns Array of text nodes
 */
export function getAllTextNodes(container: HTMLElement): Text[] {
  const nodes: Text[] = [];
  const walker = document.createTreeWalker(
    container,
    NodeFilter.SHOW_TEXT,
    null
  );
  let node: Node | null;
  while ((node = walker.nextNode())) {
    // Chỉ cần kiểm tra xem node có giá trị (không phải null/undefined)
    // KHÔNG được dùng .trim() ở đây.
    if (node.nodeValue !== null && node.nodeValue !== undefined) {
      nodes.push(node as Text);
    }
  }
  return nodes;
}

/**
 * Builds text mapping for offset conversion
 * @param textNodes - Array of text nodes
 * @returns Object with map and total text length
 */
export function buildTextMap(textNodes: Text[]): {
  map: TextMapEntry[];
  totalTextLength: number;
} {
  const map: TextMapEntry[] = [];
  let currentOffset = 0;

  for (const node of textNodes) {
    const len = node.textContent?.length || 0;
    map.push({
      node,
      start: currentOffset,
      end: currentOffset + len,
    });
    currentOffset += len;
  }

  return { map, totalTextLength: currentOffset };
}

/**
 * Normalizes text for matching by collapsing whitespace
 * @param str - String to normalize
 * @returns Normalized string
 */
export function normalize(str: string): string {
  return str.replace(/\s+/g, " ").trim();
}

/**
 * Tìm vị trí khớp văn bản.
 * Hàm này thực hiện một "tìm kiếm chuẩn hóa" (normalized search)
 * TRỰC TIẾP trên chuỗi gốc (fullText).
 * Nó trả về offset (vị trí) trong tọa độ của chuỗi GỐC.
 *
 * @param container - Container element to search in
 * @param highlightText - Text to search for
 * @returns Match position with map and offsets, or null if not found
 */
export function findMatchPosition(
  container: HTMLElement,
  highlightText: string
): MatchPosition | null {
  const textNodes = getAllTextNodes(container);
  const { map } = buildTextMap(textNodes);
  const fullText = map.map((m) => m.node.textContent || "").join("");
  const normalizedTarget = normalize(highlightText);

  if (!normalizedTarget) return null;

  let origIdx = 0; // Con trỏ cho fullText (văn bản gốc)
  let targetIdx = 0; // Con trỏ cho normalizedTarget (văn bản cần tìm)
  let startOffset = -1; // Vị trí bắt đầu khớp (trong tọa độ gốc)
  let endOffset = -1;

  // 1. Bỏ qua tất cả whitespace ở đầu (mô phỏng .trim() )
  while (origIdx < fullText.length && /\s/.test(fullText[origIdx])) {
    origIdx++;
  }

  // 2. Bắt đầu vòng lặp tìm kiếm
  while (origIdx < fullText.length) {
    const origChar = fullText[origIdx];
    const targetChar = normalizedTarget[targetIdx];
    const isOrigWhitespace = /\s/.test(origChar);

    if (isOrigWhitespace) {
      // --- TRƯỜNG HỢP 1: KÝ TỰ GỐC LÀ WHITESPACE ---
      if (targetChar === " ") {
        // Ký tự target cũng là ' ' (đã chuẩn hóa) -> Khớp
        targetIdx++; // Di chuyển con trỏ target
        origIdx++; // Di chuyển con trỏ gốc

        // Bỏ qua tất cả các whitespace tiếp theo trong chuỗi gốc (mô phỏng replace(/\s+/g, ' '))
        while (origIdx < fullText.length && /\s/.test(fullText[origIdx])) {
          origIdx++;
        }
      } else {
        // Ký tự gốc là whitespace, nhưng target không phải ' '
        // Chỉ bỏ qua whitespace trong chuỗi gốc
        origIdx++;
      }
    } else {
      // --- TRƯỜNG HỢP 2: KÝ TỰ GỐC KHÔNG PHẢI WHITESPACE ---
      if (origChar === targetChar) {
        // Ký tự khớp
        if (targetIdx === 0) {
          startOffset = origIdx; // Ghi lại vị trí bắt đầu (tọa độ GỐC)
        }
        origIdx++;
        targetIdx++;
      } else {
        // Ký tự không khớp -> Reset
        targetIdx = 0;
        // Nếu trước đó đang khớp dở,
        // thì quay lại vị trí sau ký tự bắt đầu của lần khớp hụt
        if (startOffset !== -1) {
          origIdx = startOffset + 1;
        } else {
          // Nếu chưa khớp gì, chỉ đi tiếp
          origIdx++;
        }
        startOffset = -1; // Reset vị trí bắt đầu

        // Quan trọng: Sau khi reset, chúng ta có thể đang ở trên whitespace
        // Cần bỏ qua chúng để bắt đầu tìm kiếm mới
        if (targetIdx === 0) {
          while (origIdx < fullText.length && /\s/.test(fullText[origIdx])) {
            origIdx++;
          }
        }
      }
    }

    // 3. Kiểm tra nếu đã tìm thấy toàn bộ chuỗi
    if (targetIdx === normalizedTarget.length) {
      // Đã tìm thấy!
      endOffset = origIdx; // endOffset là vị trí *sau* ký tự cuối cùng (tọa độ GỐC)
      return { map, startOffset, endOffset };
    }
  }

  // 4. Không tìm thấy
  return null;
}

/**
 * Main function that handles both highlight types and applies them
 * @param container - Container element to apply highlights to
 * @param highlights - Array of highlights to apply
 */
export function applyHighlights(
  container: HTMLElement,
  highlights: HighlightData[]
) {
  if (!highlights || highlights.length === 0) {
    // Ensure any previous wrappers are cleared
    clearAppliedHighlights(container);
    return;
  }

  // Start fresh each time
  clearAppliedHighlights(container);

  for (const h of highlights) {
    try {
      // Always use text-based matching (ignore location field)
      // This ensures highlights work even when DOM structure changes
      const match = findMatchPosition(container, h.text);
      if (!match) {
        continue;
      }

      // Create range from the matched position
      const range = createRangeFromMatchPosition(container, match);
      if (!range) {
        continue;
      }

      // Apply the highlight
      applyDistributedHighlight(
        range,
        h.color ?? "rgba(255, 235, 59, 0.6)",
        h.id
      );
    } catch (e) {
      // If any single highlight fails (DOM changed), skip it
    }
  }
}

/**
 * Creates a range from a match position by temporarily removing highlights
 * @param container - Container element
 * @param match - Match position with map and offsets
 * @returns Range object or null if creation fails
 */
export function createRangeFromMatchPosition(
  container: HTMLElement,
  match: MatchPosition
): Range | null {
  try {
    // Find the nodes and offsets for the given text positions
    let startNode: Text | null = null;
    let endNode: Text | null = null;
    let startNodeOffset = 0;
    let endNodeOffset = 0;

    for (const entry of match.map) {
      // Check if start offset is in this node
      if (
        !startNode &&
        match.startOffset >= entry.start &&
        match.startOffset < entry.end
      ) {
        startNode = entry.node;
        startNodeOffset = match.startOffset - entry.start;
      }

      // Check if end offset is in this node
      if (
        !endNode &&
        match.endOffset >= entry.start &&
        match.endOffset <= entry.end
      ) {
        endNode = entry.node;
        endNodeOffset = match.endOffset - entry.start;
      }

      if (startNode && endNode) break;
    }

    if (!startNode || !endNode) {
      return null;
    }

    // Create the range
    const range = document.createRange();
    range.setStart(startNode, startNodeOffset);
    range.setEnd(endNode, endNodeOffset);

    return range;
  } catch (e) {
    return null;
  }
}

/**
 * Resolves DOM node from path string
 * @param root - Root node to start from
 * @param path - Path string in format "0/1/2"
 * @returns The resolved DOM node
 */
export function getNodeFromPath(root: Node, path: string): Node {
  const indexes = path.split("/").map((i) => parseInt(i, 10));
  let node: Node | null = root;
  for (const index of indexes) {
    if (!node || !("childNodes" in node)) throw new Error("Invalid root");
    node = (node as ParentNode).childNodes[index] ?? null;
    if (!node) throw new Error("Invalid path: " + path);
  }
  return node as Node;
}

/**
 * Increases the opacity of a highlight color to make it darker/bolder
 * @param color - Original color string (rgba format)
 * @returns Darker version of the color
 */
function makeHighlightDarker(color: string): string {
  // Extract rgba values from color string
  const rgbaMatch = color.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
  if (!rgbaMatch) return color; // Return original if not rgba format

  const [, r, g, b, a] = rgbaMatch;
  const currentOpacity = parseFloat(a);

  // Increase opacity by 0.3 (but cap at 0.9 to maintain readability)
  const newOpacity = Math.min(currentOpacity + 0.3, 0.9);

  return `rgba(${r}, ${g}, ${b}, ${newOpacity})`;
}

/**
 * Darkens all highlight segments with the same highlight ID
 * @param container - Container element
 * @param highlightId - ID of the highlight to darken
 * @param originalColors - Map to store original colors for restoration
 */
function darkenAllHighlightSegments(
  container: HTMLElement,
  highlightId: string,
  originalColors: Map<string, string>
) {
  const segments = container.querySelectorAll(
    `article-highlight[data-highlight-id="${highlightId}"]`
  );

  segments.forEach((segment) => {
    const htmlSegment = segment as HTMLElement;
    const originalColor = htmlSegment.style.backgroundColor;

    // Store original color if not already stored
    if (!originalColors.has(highlightId)) {
      originalColors.set(highlightId, originalColor);
    }

    // Darken this segment
    const darkerColor = makeHighlightDarker(originalColor);
    htmlSegment.style.backgroundColor = darkerColor;
  });
}

/**
 * Restores all highlight segments with the same highlight ID to original color
 * @param container - Container element
 * @param highlightId - ID of the highlight to restore
 * @param originalColors - Map containing original colors
 */
function restoreAllHighlightSegments(
  container: HTMLElement,
  highlightId: string,
  originalColors: Map<string, string>
) {
  const segments = container.querySelectorAll(
    `article-highlight[data-highlight-id="${highlightId}"]`
  );

  const originalColor = originalColors.get(highlightId);
  if (originalColor) {
    segments.forEach((segment) => {
      const htmlSegment = segment as HTMLElement;
      htmlSegment.style.backgroundColor = originalColor;
    });
    originalColors.delete(highlightId);
  }
}

/**
 * Clears all delete buttons from the container
 * @param container - Container element
 */
function clearAllDeleteButtons(container: HTMLElement) {
  const deleteButtons = container.querySelectorAll(".highlight-delete-button");
  deleteButtons.forEach((button) => button.remove());
}

/**
 * Adds click handler to highlight elements for showing delete button and darkening effect
 * @param container - Container element
 * @param onDeleteHighlight - Callback function when highlight is deleted
 */
export function addHighlightClickHandlers(
  container: HTMLElement,
  onDeleteHighlight: (highlightId: string) => void
) {
  // Remove existing handlers first
  removeHighlightClickHandlers(container);

  const highlightElements = container.querySelectorAll(
    'article-highlight[data-highlight="true"]'
  );

  // Map to store original colors for each highlight ID
  const originalColors = new Map<string, string>();
  // Track currently selected highlight ID
  let currentlySelectedId: string | null = null;

  highlightElements.forEach((element) => {
    const highlightId = element.getAttribute("data-highlight-id");
    if (highlightId) {
      const htmlElement = element as HTMLElement;

      element.addEventListener("click", (e) => {
        e.stopPropagation();

        // If clicking on a different highlight, restore the previous one and clear its delete button
        if (currentlySelectedId && currentlySelectedId !== highlightId) {
          restoreAllHighlightSegments(
            container,
            currentlySelectedId,
            originalColors
          );
          // Clear any existing delete buttons
          clearAllDeleteButtons(container);
        }

        // Darken ALL segments with the same highlight ID
        darkenAllHighlightSegments(container, highlightId, originalColors);

        // Update currently selected ID
        currentlySelectedId = highlightId;

        // Show delete button (it will handle color restoration)
        showDeleteButton(
          htmlElement,
          highlightId,
          onDeleteHighlight,
          container,
          originalColors,
          () => {
            // Callback to clear currently selected ID when button is closed
            if (currentlySelectedId === highlightId) {
              currentlySelectedId = null;
            }
          }
        );
      });

      // Add visual feedback
      htmlElement.style.cursor = "pointer";
      htmlElement.title = "Click to delete highlight";
    }
  });
}

/**
 * Shows delete button for a highlight element
 */
function showDeleteButton(
  element: HTMLElement,
  highlightId: string,
  onDeleteHighlight: (highlightId: string) => void,
  container: HTMLElement,
  originalColors: Map<string, string>,
  onClose?: () => void
) {
  // Remove any existing delete button
  const existingButton = element.querySelector(".highlight-delete-button");
  if (existingButton) {
    existingButton.remove();
    // Restore ALL segments with the same highlight ID
    restoreAllHighlightSegments(container, highlightId, originalColors);
    // Call the onClose callback to clear currently selected ID
    if (onClose) {
      onClose();
    }
    return;
  }

  // Create delete button container
  const buttonContainer = document.createElement("div");
  buttonContainer.className = "highlight-delete-button";

  // Create delete button
  const deleteBtn = document.createElement("button");
  deleteBtn.className = "delete-btn";
  deleteBtn.innerHTML = "✕";
  deleteBtn.title = "Delete highlight";

  // Create cancel button
  const cancelBtn = document.createElement("button");
  cancelBtn.className = "cancel-btn";
  cancelBtn.innerHTML = "Cancel";
  cancelBtn.title = "Cancel";

  // Function to restore ALL segments and close button
  const restoreAndClose = () => {
    restoreAllHighlightSegments(container, highlightId, originalColors);
    buttonContainer.remove();
    // Call the onClose callback to clear currently selected ID
    if (onClose) {
      onClose();
    }
  };

  // Add event listeners
  deleteBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    onDeleteHighlight(highlightId);
    restoreAndClose();
  });

  cancelBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    restoreAndClose();
  });

  // Add buttons to container
  buttonContainer.appendChild(deleteBtn);
  buttonContainer.appendChild(cancelBtn);

  // Add container to highlight element
  element.appendChild(buttonContainer);

  // Add click outside handler to close button
  const clickOutsideHandler = (e: MouseEvent) => {
    if (!buttonContainer.contains(e.target as Node)) {
      restoreAndClose();
      document.removeEventListener("click", clickOutsideHandler);
    }
  };

  // Add event listener after a small delay to prevent immediate closure
  setTimeout(() => {
    document.addEventListener("click", clickOutsideHandler);
  }, 100);

  // Auto-hide after 5 seconds
  setTimeout(() => {
    if (buttonContainer.parentNode) {
      restoreAndClose();
      document.removeEventListener("click", clickOutsideHandler);
    }
  }, 5000);
}

/**
 * Removes click handlers from highlight elements
 * @param container - Container element
 */
export function removeHighlightClickHandlers(container: HTMLElement) {
  const highlightElements = container.querySelectorAll(
    'article-highlight[data-highlight="true"]'
  );

  highlightElements.forEach((element) => {
    // Clone element to remove all event listeners
    const newElement = element.cloneNode(true) as HTMLElement;
    element.parentNode?.replaceChild(newElement, element);
  });
}
