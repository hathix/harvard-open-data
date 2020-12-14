/** @jsx jsx */
import { Box, Button, Grid, Input, jsx } from "theme-ui";
import { Configure, connectHits, connectPagination, createConnector, InstantSearch } from "react-instantsearch-dom";
import { graphql } from "gatsby";
import Layout from "../containers/layout";
import SEO from "../components/core/seo";
import Container from "../components/core/container";
import GraphQLErrorList from "../components/core/graphql-error-list";
import PropTypes from "prop-types";
import algoliasearch from "algoliasearch";
import ArticlePreview from "../components/article-layouts/article-preview";
import React from "react";
import Section from "../components/core/section";
import BlockContent from "../components/block-content";
import Spacer from "../components/core/spacer";

const searchClient = algoliasearch(
  "QCACO3FFKP",
  "5e093fa7c6aa1fc410cce68c146fda00"
);

export const query = graphql`
  query SearchPageQuery {
    page: sanityPage(_id: { regex: "/(drafts.|)search/" }) {
      id
      title
      _rawBody(resolveReferences: { maxDepth: 5 })
      _rawBodySecondary(resolveReferences: { maxDepth: 5 })
    }
  }
`;

const SearchPage = (props) => {
  const { data, errors } = props;

  if (errors) {
    return (
      <Layout>
        <GraphQLErrorList errors={errors} />
      </Layout>
    );
  }

  const page = data && data.page;

  if (!page) {
    throw new Error(
      'Missing "Search" page data. Open the studio at http://localhost:3333 and add "Search" page data and restart the development server.'
    );
  }

  return (
    <Layout>
      <SEO title={page.title} />
      <Container>
        <InstantSearch indexName="HODP_Sanity" searchClient={searchClient}>
          <Grid gap={[5, 5, 6]} columns={[1, "4fr 1fr"]}>
            <Box>
              <ConnectedSearchBox/>
              <Configure hitsPerPage={10}/>
              <Spacer height={4} />
              <CustomHits hitComponent={Hit}/>
              <Spacer height={4} />
              <CustomPagination/>
            </Box>
            <Section header="Featured" showDivider={false}>
              <br/>
              <BlockContent blocks={page._rawBodySecondary || []}/>
            </Section>
          </Grid>
        </InstantSearch>
      </Container>
    </Layout>
  );
};

const connectWithQuery = createConnector({
  displayName: "WidgetWithQuery",
  getProvidedProps(props, searchState) {
    // Since the `attributeForMyQuery` searchState entry isn't
    // necessarily defined, we need to default its value.
    const currentRefinement = searchState.attributeForMyQuery || "";

    // Connect the underlying component with the `currentRefinement`
    return {currentRefinement};
  },
  refine(props, searchState, nextRefinement) {
    // When the underlying component calls its `refine` prop,
    // we update the searchState with the provided refinement.
    return {
      // `searchState` represents the search state of *all* widgets. We need to extend it
      // instead of replacing it, otherwise other widgets will lose their respective state.
      ...searchState,
      attributeForMyQuery: nextRefinement,
    };
  },
  getSearchParameters(searchParameters, props, searchState) {
    // When the `attributeForMyQuery` state entry changes, we update the query
    return searchParameters.setQuery(searchState.attributeForMyQuery || "");
  },
  cleanUp(props, searchState) {
    // When the widget is unmounted, we omit the entry `attributeForMyQuery`
    // from the `searchState`, then on the next request the query will
    // be empty
    const {attributeForMyQuery, ...nextSearchState} = searchState;

    return nextSearchState;
  },
});

const MySearchBox = ({currentRefinement, refine}) => (
  <Input
    placeholder={"Search"}
    value={currentRefinement}
    onChange={e => refine(e.currentTarget.value)}
  />
);

const ConnectedSearchBox = connectWithQuery(MySearchBox);

const Hits = ({hits}) => (
  <Grid
    gap={4}
    columns={1}
  >
    {hits.map(hit => (
      <Hit {...hit}/>
    ))}
  </Grid>
);

const CustomHits = connectHits(Hits);

function Hit(props) {
  return (
    <ArticlePreview
      horizontal={true}
      link={props.slug.current}
      _rawExcerpt={props.excerpt}
      {...props}
    />
  );
}

const Pagination = ({currentRefinement, nbPages, refine, createURL}) => (
  <div className="pagination" style={{ textAlign: "center" }}>
    {currentRefinement !== 1 && (
      <Button
        color="text"
        bg="white"
        href={createURL(currentRefinement - 1)}
        onClick={event => {
          event.preventDefault();
          refine(currentRefinement - 1);
        }}
      >
        <b>{`← Previous `}</b>
      </Button>
    )}
    {new Array(nbPages).fill(null).map((_, index) => {
      const page = index + 1;
      const style = {
        border: (theme) =>
          currentRefinement === page && `1px solid ${theme.colors.text}`,
        ":hover": {
          bg: "container",
        }
      };

      return (
        <Button
          key={index}
          color="text"
          bg="white"
          sx={style}
          href={createURL(page)}
          onClick={event => {
            event.preventDefault();
            refine(page);
          }}
        >
          <b>{page}</b>
        </Button>
      );
    })}
    {currentRefinement !== nbPages && (
      <Button
        color="text"
        bg="white"
        href={createURL(currentRefinement + 1)}
        onClick={event => {
          event.preventDefault();
          refine(currentRefinement + 1);
        }}
      >
        <b>{` Next →`}</b>
      </Button>
    )}
  </div>
);

const CustomPagination = connectPagination(Pagination);

Hit.propTypes = {
  hit: PropTypes.object.isRequired,
};

export default SearchPage;