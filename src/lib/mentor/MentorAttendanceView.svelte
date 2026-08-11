<script lang="ts">
  import Icon from '$lib/Icon.svelte';
  import { onMount } from 'svelte';
  import { apiGet, apiPost } from '$lib/api';
  import SkeletonLoader from '$lib/SkeletonLoader.svelte';

  interface MentorStudent {
    id: number;
    name: string;
    course_title: string;
    email: string;
    status: 'Present' | 'Absent' | 'Excused';
  }

  interface ActiveClass {
    id: number;
    course_title: string;
    scheduled_at: string;
  }

  let activeClass = $state<ActiveClass | null>(null);
  let classRoster = $state<MentorStudent[]>([]);
  let isLoading = $state(true);
  
  let { courseId } = $props<{ courseId?: number }>();
  let isSaving = $state(false);
  let saveMessage = $state('');

  onMount(async () => {
    try {
      // NOTE: The backend needs an endpoint like GET /mentor/active-class to fetch the current active class and its roster
      // For now, we mock the active class and pull from /mentor/students
      const studs = await apiGet<any[]>('/mentor/students');
      classRoster = (studs || []).map(s => ({
        id: s.id,
        name: s.name,
        email: s.email,
        course_title: s.course_title,
        status: 'Absent' // Default all to Absent as per requirements
      }));

      // Try to fetch active class for this course from backend
      try {
        const classData = await apiGet<any>(courseId ? `/mentor/courses/${courseId}/active-class` : '/mentor/active-class');
        if (classData) {
          activeClass = classData;
        }
      } catch (err) {
        console.warn("Could not fetch active class, using null");
        activeClass = null;
      }

    } catch {
      classRoster = [];
    } finally {
      isLoading = false;
    }
  });

  function toggleStatus(studentId: number, status: 'Present' | 'Absent' | 'Excused') {
    classRoster = classRoster.map(s => s.id === studentId ? { ...s, status } : s);
  }

  async function submitAttendance() {
    if (!activeClass) return;
    
    isSaving = true;
    saveMessage = 'Saving attendance...';
    
    try {
      // Assuming a POST /mentor/attendance/batch endpoint is created
      // For now, we simulate the save.
      await new Promise(r => setTimeout(r, 1000));
      saveMessage = 'Attendance saved successfully!';
    } catch (err: any) {
      saveMessage = err.message || 'Failed to save attendance';
    } finally {
      isSaving = false;
      setTimeout(() => saveMessage = '', 3000);
    }
  }

  function getInitials(name: string) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }
</script>

<div class="attendance-view">
  {#if isLoading}
    <SkeletonLoader type="dashboard" />
  {:else}
  
  <div class="header-row">
    <div class="header-text">
      <h2>Active Class Attendance</h2>
      <p>Mark attendance for the current ongoing class. Defaults to Absent.</p>
    </div>
  </div>

  {#if !activeClass}
    <div class="empty-state-card">
      <div class="icon-wrap"><Icon name="clock" size={32} /></div>
      <h3>No Active Class</h3>
      <p>There is no scheduled class at this current time. The attendance roster will appear automatically when your next class begins.</p>
    </div>
  {:else}
    <div class="active-class-header">
      <div class="class-info">
        <h3>{activeClass.course_title}</h3>
        <p class="time-text"><Icon name="calendar" size={14} /> {new Date(activeClass.scheduled_at).toLocaleString('en-US', { weekday: 'long', hour: 'numeric', minute: '2-digit' })}</p>
      </div>
      <div class="stats-pills">
        <div class="pill present">{classRoster.filter(s => s.status === 'Present').length} Present</div>
        <div class="pill absent">{classRoster.filter(s => s.status === 'Absent').length} Absent</div>
      </div>
    </div>

    <div class="table-card">
      <table class="roster-table">
        <thead>
          <tr>
            <th>STUDENT NAME</th>
            <th>COURSE</th>
            <th style="text-align: right;">ATTENDANCE STATUS</th>
          </tr>
        </thead>
        <tbody>
          {#if classRoster.length === 0}
            <tr><td colspan="3" style="text-align:center;padding:32px;color:#999;">No students assigned to this class.</td></tr>
          {/if}
          {#each classRoster as student}
            <tr class:is-present={student.status === 'Present'}>
              <td class="student-cell">
                <div class="avatar-circle">{getInitials(student.name)}</div>
                <div class="student-info">
                  <span class="name">{student.name}</span>
                  <span class="email">{student.email}</span>
                </div>
              </td>
              <td class="course-text">{student.course_title}</td>
              <td style="text-align: right;">
                <div class="status-toggles">
                  <button 
                    class="toggle-btn absent" 
                    class:active={student.status === 'Absent'}
                    onclick={() => toggleStatus(student.id, 'Absent')}>
                    Absent
                  </button>
                  <button 
                    class="toggle-btn excused" 
                    class:active={student.status === 'Excused'}
                    onclick={() => toggleStatus(student.id, 'Excused')}>
                    Excused
                  </button>
                  <button 
                    class="toggle-btn present" 
                    class:active={student.status === 'Present'}
                    onclick={() => toggleStatus(student.id, 'Present')}>
                    <Icon name="check" size={14} /> Present
                  </button>
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
      
      <div class="table-footer">
        <div class="footer-left">
          {#if saveMessage}
            <span class="save-msg" class:success={saveMessage.includes('success')}>{saveMessage}</span>
          {/if}
        </div>
        <button class="submit-btn" onclick={submitAttendance} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Submit Final Attendance'}
        </button>
      </div>
    </div>
  {/if}
  {/if}
</div>

<style>
  .attendance-view { display: flex; flex-direction: column; gap: 24px; }
  .header-row { display: flex; justify-content: space-between; align-items: center; }
  .header-text h2 { font-size: 1.75rem; font-weight: 700; color: var(--text-main); letter-spacing: -0.5px; }
  .header-text p { color: var(--text-muted); font-size: 0.95rem; }

  .empty-state-card {
    background-color: var(--bg-card);
    border: 1px dashed #cbd5e0;
    border-radius: var(--radius-md);
    padding: 60px 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 12px;
  }
  .empty-state-card .icon-wrap { color: #a0aec0; }
  .empty-state-card h3 { font-size: 1.2rem; font-weight: 700; color: var(--text-main); }
  .empty-state-card p { font-size: 0.9rem; color: var(--text-muted); max-width: 400px; line-height: 1.5; }

  .active-class-header {
    background: linear-gradient(135deg, #2b6cb0 0%, #2c5282 100%);
    border-radius: var(--radius-md);
    padding: 24px 30px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 4px 15px rgba(43, 108, 176, 0.3);
    color: white;
  }

  .class-info h3 { font-size: 1.4rem; font-weight: 700; margin-bottom: 6px; }
  .class-info .time-text { font-size: 0.9rem; font-weight: 500; display: flex; align-items: center; gap: 6px; opacity: 0.9; }

  .stats-pills { display: flex; gap: 12px; }
  .pill { padding: 6px 14px; border-radius: 20px; font-size: 0.85rem; font-weight: 700; background: rgba(255,255,255,0.2); backdrop-filter: blur(4px); }
  .pill.present { background: rgba(72, 187, 120, 0.9); }
  .pill.absent { background: rgba(229, 62, 62, 0.9); }

  .table-card { background-color: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-md); box-shadow: var(--shadow-sm); overflow: hidden; }
  
  .roster-table { width: 100%; border-collapse: collapse; text-align: left; }
  .roster-table th { font-size: 0.75rem; font-weight: 700; color: var(--text-muted); padding: 14px 20px; border-bottom: 1px solid var(--border-color); background-color: #fafbfc; }
  .roster-table td { padding: 16px 20px; font-size: 0.9rem; border-bottom: 1px solid var(--border-color); vertical-align: middle; transition: background 0.2s; }
  
  .roster-table tr.is-present td { background-color: #f0fff4; }

  .student-cell { display: flex; align-items: center; gap: 12px; }
  .avatar-circle { width: 36px; height: 36px; border-radius: 50%; background-color: #edf2f7; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: 700; color: var(--text-muted); }
  
  .student-info { display: flex; flex-direction: column; }
  .student-info .name { font-weight: 700; color: var(--text-main); }
  .student-info .email { font-size: 0.75rem; color: var(--text-muted); }
  
  .course-text { font-weight: 600; color: var(--text-main); }

  .status-toggles { display: flex; justify-content: flex-end; gap: 8px; }
  .toggle-btn { padding: 8px 16px; border-radius: var(--radius-sm); font-size: 0.8rem; font-weight: 700; cursor: pointer; border: 1px solid var(--border-color); background: transparent; color: var(--text-muted); transition: all 0.2s; display: flex; align-items: center; gap: 6px;}
  
  .toggle-btn.absent.active { background-color: #fff5f5; color: #e53e3e; border-color: #feb2b2; }
  .toggle-btn.excused.active { background-color: #fffff0; color: #d69e2e; border-color: #f6e05e; }
  .toggle-btn.present.active { background-color: #48bb78; color: white; border-color: #48bb78; box-shadow: 0 2px 4px rgba(72,187,120,0.3); }

  .table-footer { display: flex; justify-content: space-between; align-items: center; padding: 20px; border-top: 1px solid var(--border-color); background-color: #fafbfc; }
  
  .save-msg { font-size: 0.85rem; font-weight: 600; color: #e53e3e; }
  .save-msg.success { color: #38a169; }

  .submit-btn { background-color: var(--primary); color: white; border: none; padding: 10px 24px; font-size: 0.9rem; font-weight: 600; border-radius: var(--radius-md); cursor: pointer; box-shadow: 0 4px 10px rgba(229, 62, 62, 0.2); transition: all 0.2s; }
  .submit-btn:hover { background-color: var(--primary-hover); transform: translateY(-1px); }
  .submit-btn:disabled { opacity: 0.7; cursor: not-allowed; transform: none; }
</style>
