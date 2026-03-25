import type Configure from '@adonisjs/core/commands/configure'

export async function configure(command: Configure) {
  const codemods = await command.createCodemods()

  /**
   * Register the provider inside `adonisrc.ts`
   */
  await codemods.updateRcFile((rcFile) => {
    rcFile.addProvider('@codenameryuu/adonis-lucid-auto-preload/provider')
  })
}
