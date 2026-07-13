<script lang="ts">
  import StudentsDashboard from '$lib/StudentsDashboard.svelte';
  let { data } = $props();
</script>

<svelte:head>
  <title>Student Dashboard — MelodyFlow</title>
  <meta name="description" content="MelodyFlow Student Dashboard — view your courses, schedule, and payments." />
</svelte:head>

<StudentsDashboard {data} />

