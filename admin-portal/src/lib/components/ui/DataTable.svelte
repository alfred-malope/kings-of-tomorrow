<script lang="ts" generics="Row extends Record<string, unknown>">
  import type { Snippet } from 'svelte';
  import type { Column } from './data-table.types';

  interface Props {
    columns: Column<Row>[];
    rows: Row[];
    /** Optional custom cell renderer. Receives the row and column key. */
    cell?: Snippet<[Row, string]>;
    /** Message shown when there are no rows. */
    emptyMessage?: string;
  }

  let { columns, rows, cell, emptyMessage = 'No data to display.' }: Props = $props();

  function defaultValue(row: Row, col: Column<Row>): unknown {
    if (col.accessor) return col.accessor(row);
    return row[col.key];
  }
</script>

{#if rows.length === 0}
  <div class="rounded-xl border border-white/10 px-4 py-8 text-center text-white/60">
    {emptyMessage}
  </div>
{:else}
  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <!-- MOBILE: Card layout (< md / 768px)                                    -->
  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <div class="flex flex-col gap-3 md:hidden">
    {#each rows as row, i (i)}
      <div class="rounded-xl border border-white/10 bg-navy-800/40 p-4">
        {#each columns as col (col.key)}
          {#if col.label}
            <div class="flex items-start justify-between gap-3 py-1.5 {col.key === columns[0]?.key ? '' : 'border-t border-white/5'}">
              <span class="shrink-0 text-[0.65rem] font-bold uppercase tracking-widest text-white/40">{col.label}</span>
              <span class="text-right text-sm text-white/90">
                {#if cell}
                  {@render cell(row, col.key)}
                {:else}
                  {defaultValue(row, col) ?? ''}
                {/if}
              </span>
            </div>
          {:else}
            <!-- Actions column (no label) rendered full-width at the bottom -->
            <div class="mt-2 border-t border-white/5 pt-3">
              {#if cell}
                {@render cell(row, col.key)}
              {:else}
                {defaultValue(row, col) ?? ''}
              {/if}
            </div>
          {/if}
        {/each}
      </div>
    {/each}
  </div>

  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <!-- DESKTOP: Standard table (md+ / >= 768px)                              -->
  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <div class="hidden md:block">
    <div class="w-full overflow-x-auto rounded-xl border border-white/10">
      <table class="w-full border-collapse text-left text-sm">
        <thead>
          <tr class="border-b border-white/10 bg-navy-800/60">
            {#each columns as col (col.key)}
              <th class="text-eyebrow whitespace-nowrap px-4 py-3">{col.label}</th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each rows as row, i (i)}
            <tr class="border-b border-white/5 transition-colors hover:bg-navy-800/40">
              {#each columns as col (col.key)}
                <td class="px-4 py-3 align-middle text-white/90">
                  {#if cell}
                    {@render cell(row, col.key)}
                  {:else}
                    {defaultValue(row, col) ?? ''}
                  {/if}
                </td>
              {/each}
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
{/if}
