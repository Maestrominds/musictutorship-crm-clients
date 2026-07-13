<script lang="ts">
  import MentorsDashboard from '$lib/MentorsDashboard.svelte';
  let { data } = $props();
</script>

<svelte:head>
  <title>Mentor Dashboard — MelodyFlow</title>
  <meta name="description" content="MelodyFlow Mentor Dashboard — manage your students, classes, and attendance." />
</svelte:head>

<MentorsDashboard {data} />

