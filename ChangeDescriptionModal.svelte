<script lang="ts">
  import ChangeDescriptionForm from '$lib/components/forms/ChangeDescriptionForm.svelte';
  import type { userSettingsValidator } from '@shared/database/zod/users/update.validator';
  import type { Infer, SuperValidated } from 'sveltekit-superforms';
  import ModalLayout from './ModalLayout.svelte';

  type Props = {
    dialogIsOpen: boolean;
    action: string;
    superForm: SuperValidated<Infer<typeof userSettingsValidator>>;
    user: { skills: string[] };
  };

  let { dialogIsOpen = $bindable(false), action, superForm, user }: Props = $props();
</script>

<ModalLayout title="global.about">
  <ChangeDescriptionForm bind:dialogIsOpen {action} {superForm} {user} />
</ModalLayout>
