export interface GetOrAddDocumentRequest {
  id: string
  url: string
  rawHtml: string
  title: string
  createAt: number
}

export interface GetOrAddDocumentResponse {
  id: string
  url: string
  isSavedBefore: boolean
}
