<script>

export let x;
export let y;
export let display = false;
</script>

<style type="text/scss">
    div.tooltip {
        display: none;
        color: #222;
        background-color: #ff9;
        padding: .5em;
        border: solid 1px #999;
        text-shadow: #f5f5f5 0 2px 0;
        border-radius: 2px;
        position: absolute;
    }
    div.tooltip.show { display: block; }
    
</style>

<div class="tooltip { display === true ? 'show' : ''}" style="left: {x}px; top: {y}px">
    <slot></slot>
</div>