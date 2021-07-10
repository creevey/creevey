<script>
  import { Meta, Template, Story } from "@storybook/addon-svelte-csf";
  import Button from "../src/Button.svelte";
</script>

<Meta
  title="Button"
  component={Button}
  argTypes={{
    label: { control: "text" },
    primary: { control: "boolean" },
    onClick: { action: "onClick" },
  }}
/>

<Template let:args>
  <Button {...args} on:click={args.onClick} />
</Template>

<Story
  name="Primary"
  parameters={{
    creevey: {
      delay: 1000,
      tests: {
        async click() {
          // TODO Write more complex example
          await this.browser.takeScreenshot()
        }
      }
    }
  }}
  args={{
    primary: true,
    label: "Button",
  }}
/>

<Story name="Simple">
  <Button label="Button" />
</Story>
