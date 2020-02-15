import {Command, flags} from '@oclif/command'

const csv = require('csvtojson')
const fs = require('fs')
const math = require('mathjs')
const ed = require('edit-distance')

class BrainDataCook extends Command {
  static description = 'describe the command here'

  static flags = {
    // add --version flag to show CLI version
    version: flags.version({char: 'v'}),
    help: flags.help({char: 'h'}),
    // flag with a value (-n, --name=VALUE)
    name: flags.string({char: 'n', description: 'name to print'}),
    // flag with no value (-f, --force)
    force: flags.boolean({char: 'f'}),
  }

  static args = [{name: 'file'}]

  async run() {
    const {args, flags} = this.parse(BrainDataCook)

    const time_series_length = 16;
    const metrics_length = 116;
    var nodes_array = ["Precentral_L","Precentral_R","Frontal_Sup_L","Frontal_Sup_R","Frontal_Sup_Orb_L","Frontal_Sup_Orb_R","Frontal_Mid_L","Frontal_Mid_R","Frontal_Mid_Orb_L","Frontal_Mid_Orb_R","Frontal_Inf_Oper_L","Frontal_Inf_Oper_R","Frontal_Inf_Tri_L","Frontal_Inf_Tri_R","Frontal_Inf_Orb_L","Frontal_Inf_Orb_R","Rolandic_Oper_L","Rolandic_Oper_R","Supp_Motor_Area_L","Supp_Motor_Area_R","Olfactory_L","Olfactory_R","Frontal_Sup_Medial_L","Frontal_Sup_Medial_R","Frontal_Med_Orb_L","Frontal_Med_Orb_R","Rectus_L","Rectus_R","Insula_L","Insula_R","Cingulum_Ant_L","Cingulum_Ant_R","Cingulum_Mid_L","Cingulum_Mid_R","Cingulum_Post_L","Cingulum_Post_R","Hippocampus_L","Hippocampus_R","ParaHippocampal_L","ParaHippocampal_R","Amygdala_L","Amygdala_R","Calcarine_L","Calcarine_R","Cuneus_L","Cuneus_R","Lingual_L","Lingual_R","Occipital_Sup_L","Occipital_Sup_R","Occipital_Mid_L","Occipital_Mid_R","Occipital_Inf_L","Occipital_Inf_R","Fusiform_L","Fusiform_R","Postcentral_L","Postcentral_R","Parietal_Sup_L","Parietal_Sup_R","Parietal_Inf_L","Parietal_Inf_R","SupraMarginal_L","SupraMarginal_R","Angular_L","Angular_R","Precuneus_L","Precuneus_R","Paracentral_Lobule_L","Paracentral_Lobule_R","Caudate_L","Caudate_R","Putamen_L","Putamen_R","Pallidum_L","Pallidum_R","Thalamus_L","Thalamus_R","Heschl_L","Heschl_R","Temporal_Sup_L","Temporal_Sup_R","Temporal_Pole_Sup_L","Temporal_Pole_Sup_R","Temporal_Mid_L","Temporal_Mid_R","Temporal_Pole_Mid_L","Temporal_Pole_Mid_R","Temporal_Inf_L","Temporal_Inf_R","Cerebelum_Crus1_L","Cerebelum_Crus1_R","Cerebelum_Crus2_L","Cerebelum_Crus2_R","Cerebelum_3_L","Cerebelum_3_R","Cerebelum_4_5_L","Cerebelum_4_5_R","Cerebelum_6_L","Cerebelum_6_R","Cerebelum_7b_L","Cerebelum_7b_R","Cerebelum_8_L","Cerebelum_8_R","Cerebelum_9_L","Cerebelum_9_R","Cerebelum_10_L","Cerebelum_10_R","Vermis_1_2","Vermis_3","Vermis_4_5","Vermis_6","Vermis_7","Vermis_8","Vermis_9","Vermis_10"];
    var links_map = new Map();
    var nodes = new Array();
    nodes_array.forEach((d1,i1)=>{
      nodes_array.forEach((d2,i2)=>{
        if(i1!=i2){
          let key = i1>i2?i1+"|"+i2:i2+"|"+i1;
          let source, target;
          if(i1>i2){
            source = i1;
            target = i2;
          }else{
            source = i2;
            target = i1;
          }
          if(!links_map.has(key)){
            links_map.set(key,{
              'source':source,
              'target':target,
              'seq':[new Array(16),new Array(16)]
            });
          }
          
        }
      });
    });

    nodes_array.forEach((d,i)=>{
      nodes.push({
        'id':i,
        'name':d,
        'value':0
      });
    });

    let links = new Array();
    let results = {'nodes':nodes,'links':links};
    let clazz = ['ADHD','TDC'];
    let headers:any;
    for(let i = 1;i<=16;i++){
      for(let j in clazz){
        let file = 'data/ADHD-TDC/'+clazz[j]+'_S1_'+i+'.csv';

        const jsonObj = await csv().on('header',(header:any)=>{
          headers = header;
        }).fromFile(file);

        jsonObj.forEach((data:any,i1:number)=>{
          
          for(let i2 = 0;i2<116;i2++){
            if(i1!=i2){
              let key = i1>i2?i1+"|"+i2:i2+"|"+i1;
              let v = data[headers[i2+1]];
              
              if(v>=0.4){
                v = 1;
              }else if(v<=-0.4){
                v = -1;
              }else{
                v = 0;
              }

              links_map.get(key).seq[j][i-1]=v;
            }
          }
        });
      } 
    }

    

    links_map.forEach((v,k)=>{
      
      var insert, remove, update;
      insert = remove = function(node:any) { return 1; };
      update = function(stringA:string, stringB:string) { return stringA !== stringB ? 1 : 0; };
      let lev:any = ed.levenshtein(v.seq[0].join(''),v.seq[1].join(''),insert, remove, update)

      v.value = lev.distance
      
      if(math.abs(v.value)>=18){
        links.push(v);
      }
    });

    results.nodes.forEach((v,i)=>{
      links.forEach((l)=>{
        if(l.target == i || l.source == i){
          v.value += l.value;
        }
      });
    });

    let nodes_ = results.nodes.filter(n=>{
      let f = false;
      links.forEach((l)=>{
        if(l.target == n.id || l.source == n.id){
          f = true;
        }
      });
      return f;
    }).map(n=>{return {name:n.name,value:n.value,oid:n.id}});

    links.forEach((l)=>{
      nodes_.forEach((v,i)=>{
        if(l.source==v.oid){
          l.source = i
        }
        if(l.target==v.oid){
          l.target = i
        }
      })
    });

    results.nodes = nodes_;


    fs.writeFileSync('brain_net_2.json',JSON.stringify(results));

  }
}

export = BrainDataCook
