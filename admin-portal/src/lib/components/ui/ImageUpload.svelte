<script lang="ts">
  import { validateUpload } from '$lib/utils/validation';
  import { uploadImage } from '$lib/firebase/storage';

  interface Props {
    /** Destination Storage path, e.g. `players/{id}/photo`. */
    storagePath: string;
    /** Called with the download URL once the upload completes. */
    onUpload: (url: string) => void;
    /** Optional existing image URL to preview. */
    currentUrl?: string | null;
    /** Field label. */
    label?: string;
  }

  let { storagePath, onUpload, currentUrl = null, label = 'Image' }: Props = $props();

  let error = $state<string | null>(null);
  let uploading = $state(false);
  let progress = $state(0);
  let uploadedUrl = $state<string | null>(null);
  // Show the freshly uploaded image if present, otherwise the provided current URL.
  const previewUrl = $derived(uploadedUrl ?? currentUrl);
  let inputEl: HTMLInputElement | null = $state(null);

  async function handleFiles(fileList: FileList | null) {
    error = null;
    const file = fileList?.[0];
    if (!file) return;

    // Client-side validation before any upload (Requirements 16.1, 16.2).
    const result = validateUpload(file);
    if (!result.valid) {
      error = result.reason;
      return;
    }

    uploading = true;
    progress = 0;
    try {
      const url = await uploadImage(storagePath, file, (p) => {
        progress = p;
      });
      uploadedUrl = url;
      onUpload(url);
    } catch {
      error = 'Upload failed. Please try again.';
    } finally {
      uploading = false;
    }
  }

  function onChange(event: Event) {
    const target = event.currentTarget as HTMLInputElement;
    handleFiles(target.files);
  }
</script>

<div class="space-y-2">
  <span class="text-eyebrow block">{label}</span>

  {#if previewUrl}
    <img src={previewUrl} alt="Preview" class="h-32 w-32 rounded-lg border border-white/10 object-cover" />
  {/if}

  <div>
    <input
      bind:this={inputEl}
      type="file"
      accept="image/jpeg,image/png,image/webp"
      onchange={onChange}
      disabled={uploading}
      class="block w-full cursor-pointer rounded-lg border border-white/20 bg-navy-800/60 text-sm text-white/80 file:mr-4 file:cursor-pointer file:border-0 file:bg-blue-500 file:px-4 file:py-2 file:text-sm file:font-bold file:uppercase file:tracking-wider file:text-navy-950 hover:file:bg-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-navy-900 disabled:opacity-50"
    />
  </div>

  {#if uploading}
    <div class="h-2 w-full overflow-hidden rounded-full bg-navy-700" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={progress}>
      <div class="h-full bg-blue-500 transition-all duration-150" style="width: {progress}%"></div>
    </div>
    <p class="text-xs text-white/60">Uploading… {progress}%</p>
  {/if}

  {#if error}
    <p class="text-sm text-red-400" role="alert">{error}</p>
  {/if}
</div>
