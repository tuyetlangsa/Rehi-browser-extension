/**
 * Utility functions for text highlighting functionality
 * Ported from NextJS web implementation
 */

/**
 * Gets the path to an element in the DOM tree
 * Returns both string path and array path for different use cases
 */
export function getElementPath(element: Node): {
  stringPath: string
  arrayPath: number[]
} {
  const path: number[] = []
  let current: Node | null = element

  // Walk up the DOM tree to build the path
  while (current && current !== document.body) {
    const parent = current.parentNode
    if (!parent) break

    const siblings = Array.from(parent.childNodes)
    const index = siblings.indexOf(current as ChildNode)
    path.unshift(index)
    current = parent
  }

  // Convert array path to string path
  const stringPath = path.join("/")

  return {
    stringPath,
    arrayPath: path
  }
}

/**
 * Extracts HTML content from a Range object
 */
export function getSelectionHTML(range: Range): string {
  const container = document.createElement("div")
  container.appendChild(range.cloneContents())
  return container.innerHTML
}

/**
 * Converts HTML to Markdown format
 * This is a basic implementation - you might want to use a library like turndown for more robust conversion
 */
export function htmlToMarkdown(html: string): string {
  // Create a temporary element to parse the HTML
  const temp = document.createElement("div")
  temp.innerHTML = html

  // Basic HTML to Markdown conversion
  let markdown = temp.innerHTML

  // Convert common HTML tags to Markdown
  markdown = markdown.replace(/<strong>(.*?)<\/strong>/gi, "**$1**")
  markdown = markdown.replace(/<b>(.*?)<\/b>/gi, "**$1**")
  markdown = markdown.replace(/<em>(.*?)<\/em>/gi, "*$1*")
  markdown = markdown.replace(/<i>(.*?)<\/i>/gi, "*$1*")
  markdown = markdown.replace(/<h1>(.*?)<\/h1>/gi, "# $1\n")
  markdown = markdown.replace(/<h2>(.*?)<\/h2>/gi, "## $1\n")
  markdown = markdown.replace(/<h3>(.*?)<\/h3>/gi, "### $1\n")
  markdown = markdown.replace(/<h4>(.*?)<\/h4>/gi, "#### $1\n")
  markdown = markdown.replace(/<h5>(.*?)<\/h5>/gi, "##### $1\n")
  markdown = markdown.replace(/<h6>(.*?)<\/h6>/gi, "###### $1\n")
  markdown = markdown.replace(/<p>(.*?)<\/p>/gi, "$1\n\n")
  markdown = markdown.replace(/<br\s*\/?>/gi, "\n")
  markdown = markdown.replace(
    /<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi,
    "[$2]($1)"
  )
  markdown = markdown.replace(/<ul>(.*?)<\/ul>/gis, "$1")
  markdown = markdown.replace(/<ol>(.*?)<\/ol>/gis, "$1")
  markdown = markdown.replace(/<li>(.*?)<\/li>/gi, "- $1\n")
  markdown = markdown.replace(/<blockquote>(.*?)<\/blockquote>/gis, "> $1\n")
  markdown = markdown.replace(/<code>(.*?)<\/code>/gi, "`$1`")
  markdown = markdown.replace(/<pre>(.*?)<\/pre>/gis, "```\n$1\n```\n")

  // Remove any remaining HTML tags
  markdown = markdown.replace(/<[^>]*>/g, "")

  // Decode HTML entities
  markdown = markdown.replace(/&lt;/g, "<")
  markdown = markdown.replace(/&gt;/g, ">")
  markdown = markdown.replace(/&amp;/g, "&")
  markdown = markdown.replace(/&quot;/g, '"')
  markdown = markdown.replace(/&#39;/g, "'")
  markdown = markdown.replace(/&nbsp;/g, " ")

  // Clean up extra whitespace
  markdown = markdown.replace(/\n\s*\n\s*\n/g, "\n\n")
  markdown = markdown.trim()

  return markdown
}
