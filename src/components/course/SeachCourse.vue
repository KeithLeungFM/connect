<template>
    <v-autocomplete
        v-model="model"
        :items="items"
        color="white"
        hide-selected
        item-text="Description"
        item-value="Course"
        label="Search your Courses"
        placeholder="Start typing to Search"
        prepend-icon="mdi-database-search"
        
        @change="onchangeclass()"
    ></v-autocomplete>
</template>

<script>
import courseimport from './courseIndexSearchList'

export default {
    props: ['courses'],
    data: () => ({
        model: null,
        // courses: courseimport
    }),
    methods: {
        onchangeclass(){
            if(this.model == null){
                return
            }
            // this.$router.push('./course/'+ this.model)
            // let routeData = this.$router.resolve('./project/rate/'+ this.model);
            // window.open(routeData.href, '_blank');
            // 域名需要除去课名，只留下代码
            var coursecode=this.model.split(" ")[0];
            this.$router.push('./rate/'+ coursecode);
        }
    },
    computed: {
        items () {
            var result = []
            for(let num in this.courses){
                result.push(this.courses[num]['name'])
            }
            // console.log("result", result)
            return result
        },
    },
}
</script>

<style scoped>
.v-autocomplete{
    min-width: 500px;
    min-height: 100px;
}
</style>