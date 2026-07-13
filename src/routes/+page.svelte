<script lang="ts">
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';

  // Redirect root path to login page
  if (browser) {
    goto('/login', { replaceState: true });
  }
</script>
