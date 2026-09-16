/** Column definition for the generic {@link DataTable} component. */
export interface Column<Row> {
  /** Key of the row field to display, or a logical id when using a custom cell. */
  key: string;
  /** Column header label. */
  label: string;
  /** Optional accessor for the plain-text value of a cell. */
  accessor?: (row: Row) => unknown;
}
