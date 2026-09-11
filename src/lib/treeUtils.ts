import { ProjectFile } from "../types";

export interface TreeNode {
  name: string;
  path: string; // Full relative path (e.g. "src/components/Header.tsx" or "src/components")
  isFolder: boolean;
  children?: TreeNode[];
  fileCount?: number;
  isScaffold?: boolean;
}

/**
 * Optimizes path parsing by flattening redundant wrapper folders.
 * When a user uploads a directory via <input webkitdirectory />,
 * checks if the top-level root folder contains only a single child folder with the exact same name
 * (e.g., ProjectCompass/ProjectCompass/) or redundant wrappers.
 * Flattens the paths so rendering starts from the first meaningful divergent directory to save horizontal space.
 */
export function flattenRedundantPathWrappers(files: ProjectFile[]): ProjectFile[] {
  if (!files || files.length === 0) return files;

  let currentFiles = files.map((f) => ({
    ...f,
    path: f.path.replace(/\\/g, "/").replace(/^\/+/, ""),
  }));

  let canFlatten = true;
  while (canFlatten) {
    canFlatten = false;
    const splitPaths = currentFiles.map((f) => f.path.split("/").filter(Boolean));

    // Every file must have at least 2 segments (root folder + child item)
    if (!splitPaths.every((segs) => segs.length >= 2)) {
      break;
    }

    const firstSegment = splitPaths[0][0];
    // Check if ALL files share the exact same top-level root folder
    const allShareFirst = splitPaths.every((segs) => segs[0] === firstSegment);
    if (!allShareFirst) {
      break;
    }

    // Check second segment across all files
    const secondSegment = splitPaths[0][1];
    const allShareSecond = splitPaths.every((segs) => segs[1] === secondSegment);

    // Condition 1: Check if top-level root folder contains only a single child folder with the exact same name (e.g. ProjectCompass/ProjectCompass/)
    if (allShareSecond && firstSegment.trim().toLowerCase() === secondSegment.trim().toLowerCase()) {
      currentFiles = currentFiles.map((f) => {
        const segs = f.path.split("/").filter(Boolean);
        return {
          ...f,
          path: segs.slice(1).join("/"),
        };
      });
      canFlatten = true;
      continue;
    }
  }

  return currentFiles;
}

/**
 * Builds a hierarchical tree from a flat list of ProjectFiles
 */
export function buildFileTree(files: ProjectFile[]): TreeNode[] {
  const rootNodes: TreeNode[] = [];
  const normalizedFiles = flattenRedundantPathWrappers(files);

  for (const file of normalizedFiles) {
    // Normalize path separators
    const normalizedPath = file.path.replace(/\\/g, "/").replace(/^\/+/, "");
    const segments = normalizedPath.split("/").filter(Boolean);

    let currentLevel = rootNodes;
    let currentPath = "";

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      currentPath = currentPath ? `${currentPath}/${segment}` : segment;
      const isLast = i === segments.length - 1;

      let existingNode = currentLevel.find((node) => node.name === segment);

      if (!existingNode) {
        existingNode = {
          name: segment,
          path: currentPath,
          isFolder: !isLast,
          isScaffold: isLast ? file.isScaffold : false,
          children: isLast ? undefined : [],
        };
        currentLevel.push(existingNode);
      } else if (isLast && file.isScaffold) {
        existingNode.isScaffold = true;
      }

      if (!isLast) {
        if (!existingNode.children) {
          existingNode.children = [];
        }
        currentLevel = existingNode.children;
      }
    }
  }

  // Recursive sort: Folders first (alphabetical), then files (alphabetical)
  function sortNodes(nodes: TreeNode[]): TreeNode[] {
    nodes.sort((a, b) => {
      if (a.isFolder && !b.isFolder) return -1;
      if (!a.isFolder && b.isFolder) return 1;
      return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" });
    });

    for (const node of nodes) {
      if (node.children && node.children.length > 0) {
        sortNodes(node.children);
        // Calculate recursive file count
        node.fileCount = countFilesInNode(node);
      }
    }

    return nodes;
  }

  function countFilesInNode(node: TreeNode): number {
    if (!node.isFolder) return 1;
    if (!node.children) return 0;
    return node.children.reduce((acc, child) => acc + countFilesInNode(child), 0);
  }

  return sortNodes(rootNodes);
}

/**
 * Get all parent folder paths for a given file path
 */
export function getParentPaths(filePath: string): string[] {
  const normalizedPath = filePath.replace(/\\/g, "/").replace(/^\/+/, "");
  const segments = normalizedPath.split("/").filter(Boolean);
  const parentPaths: string[] = [];

  let current = "";
  for (let i = 0; i < segments.length - 1; i++) {
    current = current ? `${current}/${segments[i]}` : segments[i];
    parentPaths.push(current);
  }

  return parentPaths;
}

/**
 * Returns all folder paths present in a tree
 */
export function getAllFolderPaths(nodes: TreeNode[]): string[] {
  const folders: string[] = [];
  function traverse(n: TreeNode) {
    if (n.isFolder) {
      folders.push(n.path);
      if (n.children) {
        n.children.forEach(traverse);
      }
    }
  }
  nodes.forEach(traverse);
  return folders;
}

/**
 * Returns all descendant file paths (leaf nodes) under a given TreeNode
 */
export function getAllDescendantFilePaths(node: TreeNode): string[] {
  if (!node.isFolder) {
    return [node.path];
  }
  if (!node.children || node.children.length === 0) {
    return [];
  }
  const files: string[] = [];
  for (const child of node.children) {
    files.push(...getAllDescendantFilePaths(child));
  }
  return files;
}

export type CheckState = "checked" | "unchecked" | "indeterminate";

/**
 * Computes the checked, unchecked, or indeterminate state of any node
 */
export function computeNodeCheckState(
  node: TreeNode,
  checkedPaths: Set<string>
): CheckState {
  if (!node.isFolder) {
    return checkedPaths.has(node.path) ? "checked" : "unchecked";
  }

  const allFiles = getAllDescendantFilePaths(node);
  if (allFiles.length === 0) {
    return "unchecked";
  }

  let checkedCount = 0;
  for (const file of allFiles) {
    if (checkedPaths.has(file)) {
      checkedCount++;
    }
  }

  if (checkedCount === allFiles.length) {
    return "checked";
  }
  if (checkedCount === 0) {
    return "unchecked";
  }
  return "indeterminate";
}

/**
 * Toggles a node's selection state with cascading downward propagation.
 * - If currently checked -> unchecks all descendant files.
 * - If currently unchecked or indeterminate -> checks all descendant files.
 * Ancestor states update automatically via computeNodeCheckState.
 */
export function toggleNodeCheck(
  node: TreeNode,
  currentChecked: Set<string>
): Set<string> {
  const state = computeNodeCheckState(node, currentChecked);
  const next = new Set(currentChecked);
  const allFiles = getAllDescendantFilePaths(node);

  if (state === "checked") {
    for (const f of allFiles) {
      next.delete(f);
    }
  } else {
    for (const f of allFiles) {
      next.add(f);
    }
  }

  return next;
}
