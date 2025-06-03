<script lang="ts">
  import Badge from '$lib/components/global/Badge.svelte';
  import Button from '$lib/components/global/Button.svelte';
  import Dialog from '$lib/components/global/Dialog.svelte';
  import Message from '$lib/components/global/Message.svelte';
  import * as Form from '$lib/components/ui/form/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { t } from '$lib/i18n';
  import superFormValidation from '$lib/utils/superFormValidation';
  import { createTeamValidator } from '@shared/database/zod/teams/create.validator';
  import { userSettingsValidator } from '@shared/database/zod/users/update.validator';
  import { SKILLS, type Skill } from '@shared/enum/skills';
  import type { ActionResult } from '@sveltejs/kit';
  import type { i18n as i18nType } from 'i18next';
  import { getContext } from 'svelte';
  import { toast } from 'svelte-sonner';
  import type { Readable } from 'svelte/store';
  import type { Infer, SuperValidated } from 'sveltekit-superforms';
  type Props = {
    dialogIsOpen: boolean;
    action: string;
    superForm: SuperValidated<Infer<typeof userSettingsValidator>>;
    user: { skills: string[] };
  };

  let { dialogIsOpen = $bindable(false), action, superForm, user }: Props = $props();
  let isSubmitting = $state(false);
  let descriptionValue = $state(superForm.data.description);
  let skillsDialogOpen = $state(false);
  let selectedSkills = $state<Record<string, boolean>>({});

  // Initialize the selectedSkills with user's existing skills
  $effect(() => {
    if (user.skills) {
      selectedSkills = user.skills.reduce(
        (acc, skill) => {
          acc[`skill:${skill}`] = true;
          return acc;
        },
        {} as Record<string, boolean>,
      );
    }
  });

  // add oliver's skill if not already selected
  function addSkill(skill: Skill) {
    const skillKey = `skill:${skill}`;
    if (!selectedSkills[skillKey] && Object.keys(selectedSkills).length < 5) {
      selectedSkills = { ...selectedSkills, [skillKey]: true };
    }
  }

  // remove that shskill
  function removeSkill(skill: Skill) {
    const skillKey = `skill:${skill}`;
    const { [skillKey]: _, ...rest } = selectedSkills;
    selectedSkills = rest;
  }

  const i18n: Readable<i18nType> = getContext('i18n');

  const form = superFormValidation(superForm, userSettingsValidator, {
    successMessage: 'success.user_update_success',
    errorMessage: 'error.user_update_failed',
    i18n: $i18n,
    resetForm: false,
    onSuccess: () => {
      dialogIsOpen = false;
    },
  });
  const { form: formData, enhance } = form;

  // Add hidden inputs for existing skills if NO CHANGES AT ALL ARE MADE
  $effect(() => {
    if (Object.keys(selectedSkills).length === 0 && user.skills) {
      selectedSkills = user.skills.reduce(
        (acc, skill) => {
          acc[`skill:${skill}`] = true;
          return acc;
        },
        {} as Record<string, boolean>,
      );
    }
  });
</script>

<form {action} method="POST" use:enhance class="flex flex-col gap-4">
  <Form.Field {form} name="description" class="col-span-2">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>
          <Message key="global.description" />
        </Form.Label>
        <Input placeholder={t('global.description')} {...props} bind:value={$formData.description} />
      {/snippet}
    </Form.Control>
    <Form.FieldErrors />
  </Form.Field>

  <div class="flex flex-col gap-2">
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-medium text-white">Skills</h3>
      <button
        type="button"
        onclick={() => (skillsDialogOpen = true)}
        class="rounded-full bg-primary-light-gray/10 px-3 py-1 text-sm text-white hover:bg-primary-light-gray/20"
      >
        + Add skill
      </button>
    </div>

    {#if Object.keys(selectedSkills).length > 0}
      <div class="mt-4 flex flex-wrap gap-2">
        {#each Object.keys(selectedSkills) as skillKey}
          <span
            class="rounded-full bg-gradient-to-r from-primary-blue/50 to-primary-purple/50 px-3 py-1 text-sm text-white backdrop-blur-sm transition-all hover:from-primary-blue/60 hover:to-primary-purple/60"
          >
            {skillKey.split(':')[1]}
          </span>
        {/each}
      </div>
    {:else if user.skills && user.skills.length > 0}
      <div class="mt-4 flex flex-wrap gap-2">
        {#each user.skills as skill}
          <span
            class="rounded-full bg-gradient-to-r from-primary-blue/50 to-primary-purple/50 px-3 py-1 text-sm text-white backdrop-blur-sm transition-all hover:from-primary-blue/60 hover:to-primary-purple/60"
          >
            {skill}
          </span>
        {/each}
      </div>
    {:else}
      <p class="text-sm text-primary-light-gray/50">No skills selected</p>
    {/if}
  </div>

  <Button {isSubmitting} class="mt-3 w-full" size="lg" type="submit">
    <Message key="global.save_changes" />
  </Button>

  {#each Object.keys(selectedSkills) as skillKey}
    <input type="hidden" name={skillKey} value={selectedSkills[skillKey]} />
  {/each}

  <Dialog bind:open={skillsDialogOpen}>
    {#snippet content()}
      <div class="flex flex-col gap-6 p-8">
        <div class="flex flex-col space-y-3 text-center sm:text-left">
          <h2 class="text-xl font-bold uppercase">
            <Message key="Select Skills" />
          </h2>
        </div>
        <div class="flex flex-wrap justify-center gap-2">
          {#each SKILLS as skill}
            <Badge
              variant={selectedSkills[`skill:${skill}`] ? 'secondary' : 'default'}
              size="md"
              class="cursor-pointer select-none"
              onclick={() => addSkill(skill)}
              style="opacity: {Object.keys(selectedSkills).length >= 5 && !selectedSkills[`skill:${skill}`]
                ? 0.3
                : selectedSkills[`skill:${skill}`]
                  ? 0.5
                  : 1}; pointer-events: {Object.keys(selectedSkills).length >= 5 && !selectedSkills[`skill:${skill}`]
                ? 'none'
                : 'auto'}"
            >
              <span class={selectedSkills[`skill:${skill}`] ? 'text-primary-light-gray/50' : ''}>+</span>
              {skill}
            </Badge>
          {/each}

          {#if Object.keys(selectedSkills).length > 0}
            <div class="my-4 w-full border-t border-primary-light-gray/20" />
            <div class="mb-2 w-full text-center text-sm text-primary-light-gray/50">Selected Skills</div>
          {/if}

          {#each Object.keys(selectedSkills) as skillKey}
            <Badge
              variant="secondary"
              size="md"
              class="cursor-pointer select-none"
              onclick={() => removeSkill(skillKey.split(':')[1] as Skill)}
            >
              <span class="text-red-400">×</span>
              {skillKey.split(':')[1]}
            </Badge>
          {/each}
        </div>
        <div class="mt-4 flex justify-end">
          <button
            type="button"
            class="rounded-full bg-primary-blue px-4 py-2 text-sm text-white hover:bg-primary-blue/80"
            onclick={() => (skillsDialogOpen = false)}
          >
            Done
          </button>
        </div>
      </div>
    {/snippet}
  </Dialog>
</form>
